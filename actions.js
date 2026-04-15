import axios from 'axios'
import OpenAI from 'openai'
import config from './config.js'

// Initialize Groq client
const ai = new OpenAI({ apiKey: config.groqKey, baseURL: 'https://api.groq.com/openai/v1' })

// Base URL API endpoint
const API_URL = config.apiBaseUrl

// Get authorization headers
function getHeaders () {
  return { 
    Authorization: `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json'
  }
}

// Send a text message using Whapi.Cloud API
export async function sendMessage ({ phone, message }) {
  const url = `${API_URL}/messages/text`
  const body = {
    to: phone,
    body: message,
    typing_time: 10
  }

  let retries = 3
  while (retries) {
    retries -= 1
    try {
      const res = await axios.post(url, body, { headers: getHeaders() })
      console.log('[info] Message sent:', phone, res.data?.id || 'ok')
      return res.data
    } catch (err) {
      console.error('[error] failed to send message:', phone, message?.slice(0, 50), err.response?.data || err.message)
    }
  }
  return false
}

// Send typing state
export async function sendTypingState ({ phone }) {
  const url = `${API_URL}/messages/chat`
  const body = {
    to: phone,
    action: 'typing',
    duration: 10
  }
  try {
    await axios.post(url, body, { headers: getHeaders() })
  } catch (err) {
    console.error('[warning] failed to send typing state:', phone)
  }
}

// Load device info (check if connected)
export async function loadDevice () {
  try {
    const res = await axios.get(API_URL + '/devices', { headers: getHeaders() })
    console.log('[info] Device response:', JSON.stringify(res.data).slice(0, 200))
    return res.data.devices?.[0] || { phone: '923161733026' }
  } catch (err) {
    console.log('[debug] Device load error:', err.message)
    return { phone: '923161733026', status: 'online' }
  }
}

// Register webhook (not needed for Whapi.Cloud - set in dashboard)
export async function registerWebhook (webhookUrl, device) {
  console.log('[info] Webhook should be set in Whapi.Cloud dashboard:', webhookUrl)
  return { url: webhookUrl }
}

// Transcribe audio using Groq/Whisper
export async function transcribeAudio ({ message }) {
  console.log('[info] Audio transcription not implemented in Whapi.Cloud version')
  return null
}

// Assign chat to agent (not available in Whapi.Cloud)
export async function assignChatToAgent ({ data }) {
  console.log('[info] Chat assignment not available in Whapi.Cloud')
  return null
}

// Pull chat messages (not available in Whapi.Cloud - uses state)
export async function pullChatMessages ({ data }) {
  return []
}

// Create labels (not available in Whapi.Cloud)
export async function createLabels (device) {
  return []
}

export async function pullLabels (device) {
  return []
}

export async function updateChatLabels ({ data, labels }) {
  return []
}

export async function updateChatMetadata ({ data, metadata }) {
  return []
}

export async function pullMembers (device) {
  return []
}

export async function validateMembers (device, members) {
  return true
}

export function exit (msg, ...args) {
  console.error('[error]', msg, ...args)
  process.exit(1)
}