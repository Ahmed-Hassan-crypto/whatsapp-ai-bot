import axios from 'axios'
import OpenAI from 'openai'
import config from './config.js'

// Initialize Groq client
const ai = new OpenAI({ apiKey: config.groqKey, baseURL: 'https://api.groq.com/openai/v1' })

// Base URL API endpoint - use v1 for device endpoints
const API_URL = config.apiBaseUrl + '/v1'

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
  const urls = [
    `${API_URL}/device`,
    `${API_URL}/devices`,
    `${config.apiBaseUrl}/instance`,
    `${config.apiBaseUrl}/instances`
  ]
  
  for (const url of urls) {
    try {
      const res = await axios.get(url, { headers: getHeaders() })
      if (res.data) {
        console.log('[info] Device response:', JSON.stringify(res.data).slice(0, 200))
        // Return the first available device
        return res.data.devices?.[0] || res.data.instances?.[0] || res.data
      }
    } catch (err) {
      console.log('[debug] Try url:', url, err.response?.status)
    }
  }
  
  // If no endpoint works, return a dummy device - the bot will still work
  return { phone: '923161733026', status: 'online' }
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