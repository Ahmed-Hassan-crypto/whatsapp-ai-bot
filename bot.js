import OpenAI from 'openai'
import config from './config.js'
import { state, stats } from './store.js'
import * as actions from './actions.js'

const ai = new OpenAI({ apiKey: config.groqKey, baseURL: 'https://api.groq.com/openai/v1' })

function canReply ({ data }) {
  const fromNumber = data.chat.fromNumber

  if (config.numbersWhitelist?.length && !config.numbersWhitelist.some(n => n === fromNumber || fromNumber?.slice(1) === n)) {
    return false
  }

  if (config.numbersBlacklist?.length && config.numbersBlacklist.some(n => n === fromNumber || fromNumber?.slice(1) === n)) {
    return false
  }

  return true
}

function replyMessage ({ data }) {
  return async ({ message }) => {
    const phone = data.chat.fromNumber
    await actions.sendTypingState({ phone })
    await actions.sendMessage({ phone, message })

    stats[data.chat.id] = stats[data.chat.id] || { messages: 0, time: Date.now() }
    stats[data.chat.id].messages += 1
  }
}

function parseArguments (json) {
  try {
    return JSON.parse(json || '{}')
  } catch {
    return {}
  }
}

function hasChatMessagesQuota (chatId) {
  const stat = stats[chatId] = stats[chatId] || { messages: 0, time: Date.now() }
  if (stat.messages >= config.limits.maxMessagesPerChat) {
    if ((Date.now() - stat.time) >= (config.limits.maxMessagesPerChatTime * 1000)) {
      stat.messages = 0
      stat.time = Date.now()
      return true
    }
    return false
  }
  return true
}

export async function processMessage ({ data } = {}) {
  if (!canReply({ data })) {
    return console.log('[info] Skip message:', data?.chat?.fromNumber)
  }

  const chatId = data.chat.fromNumber
  if (!hasChatMessagesQuota(chatId)) {
    return console.log('[info] Skip message - quota exceeded:', chatId)
  }

  const type = data.type
  let body = data?.body?.trim().slice(0, Math.min(config.limits.maxInputCharacters, 10000))

  if (type === 'image' && config.features.imageInput) {
    body = data.body || '[Image]'
  }

  console.log('[info] New message:', chatId, type, body?.slice(0, 50))

  const reply = replyMessage({ data })

  if (!body) {
    return reply({ message: config.unknownCommandMessage })
  }

  if (/^human|person|help|stop$/i.test(body)) {
    return reply({ message: config.templateMessages.chatAssigned })
  }

  const chatMessages = state[chatId] = state[chatId] || {}

  const previousMessages = Object.values(chatMessages)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(-config.limits.chatHistoryLimit)
    .map(msg => ({
      role: msg.flow === 'inbound' ? 'user' : 'assistant',
      content: msg.body
    }))
    .filter(msg => msg.content)

  const messages = [
    { role: 'system', content: config.botInstructions },
    ...previousMessages,
    { role: 'user', content: body }
  ]

  const tools = (config.functions || []).filter(f => f?.name).map(({ name, description, parameters }) => ({
    type: 'function',
    function: { name, description, parameters }
  }))

  try {
    let completion = await ai.chat.completions.create({
      tools,
      messages,
      model: config.openaiModel,
      max_completion_tokens: config.limits.maxOutputTokens,
      temperature: config.inferenceParams.temperature
    })

    if (!completion.choices?.length) {
      return reply({ message: config.unknownCommandMessage })
    }

    let response = completion.choices[0]
    let count = 0

    while (response?.message?.tool_calls?.length && count < 10) {
      count += 1
      const responses = []
      messages.push({ role: 'assistant', tool_calls: response.message.tool_calls })

      const calls = response.message.tool_calls.filter(x => x.id && x.type === 'function')

      for (const call of calls) {
        const func = config.functions?.find(f => f.name === call.function.name)
        if (func?.run) {
          const parameters = parseArguments(call.function.arguments)
          console.log('[info] run function:', call.function.name, parameters)
          const message = await func.run({ parameters })
          if (message) {
            responses.push({ role: 'tool', content: message, tool_call_id: call.id })
          }
        }
      }

      if (!responses.length) break

      messages.push(...responses)

      completion = await ai.chat.completions.create({
        tools,
        messages,
        model: config.openaiModel,
        temperature: 0.2
      })

      if (!completion.choices?.length) break
      response = completion.choices[0]
      if (!response || response.finish_reason === 'stop') break
    }

    const replyText = response?.message?.content || config.unknownCommandMessage
    await reply({ message: replyText })

    state[chatId] = state[chatId] || {}
    state[chatId][Date.now().toString()] = { flow: 'outbound', date: new Date().toISOString(), body: replyText }

  } catch (err) {
    console.error('[error] AI failed:', err.message)
    return reply({ message: config.unknownCommandMessage })
  }
}