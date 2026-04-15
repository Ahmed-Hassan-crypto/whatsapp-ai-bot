import functions from './functions.js'
const { env } = process

// CONFIGURATION
// Set your API keys and edit the configuration as needed for your business use case.

// Required. Specify the Whapi.Cloud API token
// Sign up for free: https://whapi.cloud
const apiKey = env.WHAPI_TOKEN || ''

// Required. Specify the Groq API key to be used (free to use)
// Sign up for free here: https://console.groq.com
const groqKey = env.GROQ_API_KEY || ''

// Required. Set the Groq model to use.
// Free models: llama-3.3-70b-versatile, mixtral-8x7b-32768, llama-3.1-70b-versatile
// Full list: https://console.groq.com/docs/models
const openaiModel = env.OPENAI_MODEL || 'llama-3.3-70b-versatile'

// Ngrok tunnel authentication token.
// Required if webhook URL is not provided or running the program from your computer.
// sign up for free and get one: https://ngrok.com/signup
// Learn how to obtain the auth token: https://ngrok.com/docs/agent/#authtokens
const ngrokToken = env.NGROK_TOKEN || ''

// Default message when the user sends an unknown message.
const unknownCommandMessage = `I'm sorry, I was unable to understand your message. Can you please elaborate more?

If you would like to chat with a human, just reply with *human*.`

// Default welcome message. Change it as you need.
const welcomeMessage = 'Hey there 👋 Welcome to this ChatGPT-powered AI chatbot demo using *Wassenger API*! I can also speak many languages 😁'

// AI bot instructions to adjust its bevarior. Change it as you need.
// Use concise and clear instructions.
const botInstructions = `You are a smart virtual customer support assistant who works for Wassenger.
You can identify yourself as Milo, the Wassenger AI Assistant.
You will be chatting with random customers who may contact you with general queries about the product.
Wassenger is a cloud solution that offers WhatsApp API and multi-user live communication services designed for businesses and developers.
Wassenger also enables customers to automate WhatsApp communication and build chatbots.
You are an expert customer support agent.
Be polite. Be helpful. Be emphatic. Be concise.
Politely reject any queries that are not related to customer support tasks or Wassenger services itself.
Stick strictly to your role as a customer support virtual assistant for Wassenger.
Always speak in the language the user prefers or uses.
If you can't help with something, ask the user to type *human* in order to talk with customer support.
Do not use Markdown formatted and rich text, only raw text.`

// Default help message. Change it as you need.
const defaultMessage = `Don't be shy 😁 try asking anything to the AI chatbot, using natural language!

Example queries:

1️⃣ Explain me what is Wassenger
2️⃣ Can I use Wassenger to send automatic messages?
3️⃣ Can I schedule messages using Wassenger?
4️⃣ Is there a free trial available?

Type *human* to talk with a person. The chat will be assigned to an available member of the team.

Give it a try! 😁`

// Chatbot features. Edit as needed.
const features = {
  // Enable or disable text input processing
  audioInput: true,
  // Enable or disable audio voice responses.
  // By default the bot will only reply with an audio messages if the user sends an audio message first.
  audioOutput: true,
  // Reply only using audio voice messages instead of text.
  // Requires "features.audioOutput" to be true.
  audioOnly: false,
  // Audio voice to use for the bot responses. Requires "features.audioOutput" to be true.
  // Options: 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
  // More info: https://platform.openai.com/docs/guides/text-to-speech
  voice: 'echo',
  // Audio voice speed from 0.25 to 2. Requires "features.audioOutput" to be true.
  voiceSpeed: 1,
  // Enable or disable image input processing
  // Note: image processing can significnantly increase the AI token processing costs compared to text
  imageInput: true
}

// Template messages to be used by the chatbot on specific scenarios. Customize as needed.
const templateMessages = {
  // When the user sends an audio message that is not supported or transcription failed
  noAudioAccepted: 'Audio messages are not supported: gently ask the user to send text messages only.',
  // Chat assigned to a human agent
  chatAssigned: 'You will be contact shortly by someone from our team. Thank you for your patience.'
}

const limits = {
  // Required. Maximum number of characters from user inbound messages to be procesed.
  // Exceeding characters will be ignored.
  maxInputCharacters: 1000,
  // Required: maximum number of tokens to generate in AI responses.
  // The number of tokens is the length of the response text.
  // Tokens represent the smallest unit of text the model can process and generate.
  // AI model cost is primarely based on the input/output tokens.
  // Learn more about tokens: https://platform.openai.com/docs/concepts#tokens
  maxOutputTokens: 1000,
  // Required. Maximum number of messages to store in cache per user chat.
  // A higher number means higher OpenAI costs but more accurate responses thanks to more conversational context.
  // The recommendation is to keep it between 10 and 20.
  chatHistoryLimit: 20,
  // Required. Maximum number of messages that the bot can reply on a single chat.
  // This is useful to prevent abuse from users sending too many messages.
  // If the limit is reached, the chat will be automatically assigned to an agent
  // and the metadata key will be addded to the chat contact: "bot:chatgpt:status" = "too_many_messages"
  maxMessagesPerChat: 500,
  // Maximum number of messages per chat counter time window to restart the counter in seconds.
  maxMessagesPerChatCounterTime: 24 * 60 * 60,
  // Maximum input audio duration in seconds: default to 2 minutes
  // If the audio duration exceeds this limit, the message will be ignored.
  maxAudioDuration: 2 * 60,
  // Maximum image size in bytes: default to 2 MB
  // If the image size exceeds this limit, the message will be ignored.
  maxImageSize: 2 * 1024 * 1024
}

// Chatbot config
export default {
  // Required. Whapi.Cloud API token. See the `apiKey` declaration above.
  apiKey,

  // Required. Groq API key. See the `groqKey` declaration above.
  groqKey: groqKey,

  // Required. Set the Groq model to use. See the `openaiModel` declaration above.
  // Free models: llama-3.3-70b-versatile, mixtral-8x7b-32768
  openaiModel,

  // Callable functions for RAG to be interpreted by the AI. Optional.
  // See: functions.js
  // Edit as needed to cover your business use cases.
  // Using it you can instruct the AI to inform you to execute arbitrary functions
  // in your code based in order to augment information for a specific user query.
  // For example, you can call an external CRM in order to retrieve, save or validate
  // specific information about the customer, such as email, phone number, user ID, etc.
  // Learn more here: https://platform.openai.com/docs/guides/function-calling
  functions,

  // Supported AI features: see features declaration above
  features,

  // Limits for the chatbot: see limits declaration above
  limits,

  // Template message responses
  templateMessages,

  // Optional. HTTP server TCP port to be used. Defaults to 8080
  port: +env.PORT || 8080,

  // Optional. Use NODE_ENV=production to run the chatbot in production mode
  production: env.NODE_ENV === 'production',

  // Optional. Specify the webhook public URL to be used for receiving webhook events
  // If no webhook is specified, the chatbot will automatically create an Ngrok tunnel
  webhookUrl: env.WEBHOOK_URL,

  // Ngrok tunnel authentication token (optional).
  // Required if webhook URL is not provided or running the program from your computer.
  ngrokToken,

  // Optional. Full path to the ngrok binary.
  ngrokPath: env.NGROK_PATH,

  // Temporal files path to store audio and image files. Defaults to `.tmp/`
  tempPath: '.tmp',

  // Optional. Ignore processing messages sent by one of the following numbers
  numbersBlacklist: ['1234567890'],

  // Optional. OpenAI model completion inference params
  inferenceParams: {
    temperature: 0.2
  },

  // Optional. Only process messages from one of the given phone numbers
  numbersWhitelist: [],

  defaultMessage,
  botInstructions,
  welcomeMessage,
  unknownCommandMessage,

  // Do not change: specifies the base URL for the Whapi.Cloud API
  apiBaseUrl: env.API_URL || 'https://gate.whapi.cloud'
}

// Disable LanceDB logs: comment line to enable logs
env.LANCEDB_LOG = 0
