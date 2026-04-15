import fs from 'fs'
import config from './config.js'
import server from './server.js'
import * as actions from './actions.js'

async function main () {
  console.log('[info] Starting bot...')
  console.log('[info] API Key:', config.apiKey ? 'set' : 'missing')
  console.log('[info] Groq Key:', config.groqKey ? 'set' : 'missing')
  
  const device = await actions.loadDevice()
  console.log('[info] Device:', device)

  if (!fs.existsSync(config.tempPath)) {
    fs.mkdirSync(config.tempPath)
  }

  server.device = device || { phone: '923161733026' }
  console.log('[info] Server device:', server.device.phone)

  await server.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`)
  })

  console.log('[info] Chatbot ready!')
}

main().catch(err => {
  console.error('[error] Failed:', err)
})