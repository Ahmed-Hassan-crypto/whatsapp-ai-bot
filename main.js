import fs from 'fs'
import ngrok from 'ngrok'
import nodemon from 'nodemon'
import config from './config.js'
import server from './server.js'
import * as actions from './actions.js'
const { exit } = actions

async function createTunnel () {
  let retries = 3

  try {
    await ngrok.upgradeConfig({ relocate: false })
  } catch (err) {
    console.error('[warning] Failed to upgrade Ngrok config:', err.message)
  }

  while (retries) {
    retries -= 1
    try {
      const tunnel = await ngrok.connect({
        addr: config.port,
        authtoken: config.ngrokToken,
        path: () => config.ngrokPath
      })
      console.log(`Ngrok tunnel created: ${tunnel}`)
      config.webhookUrl = tunnel
      return tunnel
    } catch (err) {
      console.error('[error] Failed to create Ngrok tunnel:', err.message)
      await ngrok.kill()
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  throw new Error('Failed to create Ngrok tunnel')
}

async function devServer () {
  const tunnel = await createTunnel()

  nodemon({
    script: 'bot.js',
    ext: 'js',
    watch: ['*.js'],
    exec: `WEBHOOK_URL=${tunnel} DEV=false node bot.js`
  }).on('restart', () => {
    console.log('[info] Restarting bot after changes...')
  }).on('quit', () => {
    console.log('[info] Closing bot...')
    ngrok.kill().then(() => process.exit(0))
  })
}

async function main () {
  if (!config.apiKey) {
    return exit('Missing Whapi.Cloud token. Get free token at: https://whapi.cloud/dashboard')
  }

  if (!config.groqKey) {
    return exit('Missing Groq API key. Get free key at: https://console.groq.com')
  }

  if (process.env.DEV === 'true' && !config.production) {
    return devServer()
  }

  const device = await actions.loadDevice()
  console.log('[info] Device loaded:', device)

  if (!fs.existsSync(config.tempPath)) {
    fs.mkdirSync(config.tempPath)
  }

  server.device = device
  console.log('[info] WhatsApp ready:', device || 'connected')

  await server.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`)
  })

  if (!config.webhookUrl && !config.production) {
    const tunnel = await createTunnel()
    console.log('[info] Webhook URL:', tunnel)
  } else if (config.webhookUrl) {
    console.log('[info] Webhook URL:', config.webhookUrl)
  }

  console.log('[info] Chatbot server ready!')
}

main().catch(err => {
  exit('Failed to start chatbot server:', err)
})