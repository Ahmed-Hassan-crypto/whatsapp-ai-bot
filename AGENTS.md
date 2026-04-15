# AGENTS.md - whatsapp-chatgpt-bot-master

## Quick Start

```bash
npm install
npm start
```

## Required Environment Variables

- `WHAPI_TOKEN` - Whapi.Cloud API token (default provided)
- `GROQ_API_KEY` - Groq API key (free)

## Optional Environment Variables

- `OPENAI_MODEL` - Groq model (default: llama-3.3-70b-versatile)
- `WEBHOOK_URL` - Public webhook URL
- `PORT` - Server port (default: 8080)
- `NGROK_TOKEN` - Ngrok auth token

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Run bot |
| `npm run dev` | Dev mode with auto-reload |
| `npm run lint` | Lint code |

## Key Files

| File | Purpose |
|------|---------|
| `config.js` | Configuration |
| `bot.js` | AI processing |
| `server.js` | Express server |
| `actions.js` | Whapi.Cloud API |

## Setup

1. Sign up at https://whapi.cloud (free sandbox)
2. Get API token from dashboard
3. Pair WhatsApp number via QR code
4. Set webhook URL in Whapi.Cloud dashboard

## Free Limits

- 150 messages/day
- 5 active conversations/month
- 1,000 API requests/month

## Architecture

- ES Modules (`"type": "module"`)
- Groq AI (free LLM API)
- Whapi.Cloud WhatsApp API (free tier)