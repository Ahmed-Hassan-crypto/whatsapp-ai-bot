import path from 'path'
import fs from 'fs/promises'
import { createReadStream } from 'fs'
import express from 'express'
import bodyParser from 'body-parser'
import config from './config.js'
import * as bot from './bot.js'
import * as actions from './actions.js'

const app = express()

app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send({
    name: 'chatbot',
    description: 'WhatsApp Groq AI chatbot',
    endpoints: {
      webhook: { path: '/webhook', method: 'POST' },
      sendMessage: { path: '/message', method: 'POST' },
      sample: { path: '/sample', method: 'GET' }
    }
  })
})

// Whapi.Cloud webhook format
app.post('/webhook', (req, res) => {
  const { body } = req

  res.send({ ok: true })

  const event = body?.event
  const msg = body?.payload?.messages?.[0]

  if (event === 'message' && msg) {
    const fromNumber = msg.from
    const messageBody = msg.text?.body || msg.image?.caption || msg.audio?.caption || ''
    const type = msg.type

    const data = {
      id: msg.id,
      type,
      fromNumber,
      body: messageBody,
      date: msg.timestamp,
      chat: { id: fromNumber, fromNumber, contact: { phone: fromNumber } },
      media: msg[type]
    }

    bot.processMessage({ data }).catch(err => {
      console.error('[error] failed to process inbound message:', fromNumber, err.message)
    })
  }
})

app.post('/message', (req, res) => {
  const { phone, message } = req.body
  if (!phone || !message) {
    return res.status(400).send({ message: 'Invalid payload: phone and message required' })
  }

  actions.sendMessage({ phone, message }).then((data) => {
    res.send(data)
  }).catch(err => {
    res.status(500).send({ message: 'Failed to send message', error: err.message })
  })
})

app.get('/sample', (req, res) => {
  const { phone, message } = req.query
  const defaultPhone = app.device?.phone || 'YOUR_WHATSAPP_NUMBER'
  const data = {
    phone: phone || defaultPhone,
    message: message || 'Hello from WhatsApp Groq bot!'
  }
  actions.sendMessage(data).then((data) => {
    res.send(data)
  }).catch(err => {
    res.status(500).send({ message: 'Failed to send message' })
  })
})

async function fileExists (filepath) {
  try {
    await fs.access(filepath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function fileSize (filepath) {
  try {
    const stat = await fs.stat(filepath)
    return stat.size
  } catch {
    return -1
  }
}

app.get('/files/:id', async (req, res) => {
  const filename = `${req.params.id}.mp3`
  const filepath = path.join(config.tempPath, filename)
  if (!(await fileExists(filepath))) {
    return res.status(404).send({ message: 'Invalid or deleted file' })
  }

  const size = await fileSize(filepath)
  if (!size) {
    return res.status(404).send({ message: 'Invalid or deleted file' })
  }

  res.set('Content-Length', size)
  res.set('Content-Type', 'application/octet-stream')
  createReadStream(filepath).pipe(res)

  res.once('close', () => {
    fs.unlink(filepath).catch(err => {
      console.error('[error] failed to delete temp file:', filepath, err.message)
    })
  })
})

app.use((err, req, res, next) => {
  res.status(500).send({ message: `Unexpected error: ${err.message}` })
})

export default app