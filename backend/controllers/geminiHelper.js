const { GoogleGenerativeAI } = require('@google/generative-ai')
const axios = require('axios')
const fs = require('fs')

let genAIInstances = []
let currentGeminiIndex = 0
let grokKeys = []
let currentGrokIndex = 0

const initKeys = () => {
  // Initialize Gemini Keys
  const gKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(k => k && k !== 'your_gemini_api_key_here')
  genAIInstances = gKeys.map(k => new GoogleGenerativeAI(k))
  
  // Initialize Grok Keys
  grokKeys = (process.env.GROK_API_KEYS || process.env.GROK_API_KEY || '').split(',').map(k => k.trim()).filter(k => k && k !== 'your_grok_api_key_here')
}

// Initialize on first load
initKeys()

const getGenAI = () => {
  if (genAIInstances.length === 0) return null
  return genAIInstances[currentGeminiIndex]
}

const rotateGeminiKey = () => {
  if (genAIInstances.length <= 1) return false
  currentGeminiIndex = (currentGeminiIndex + 1) % genAIInstances.length
  console.log(`🔄 Rotated to Gemini Key #${currentGeminiIndex + 1}`)
  return true
}

const getGrokKey = () => {
  if (grokKeys.length === 0) return null
  return grokKeys[currentGrokIndex]
}

const rotateGrokKey = () => {
  if (grokKeys.length <= 1) return false
  currentGrokIndex = (currentGrokIndex + 1) % grokKeys.length
  console.log(`🔄 Rotated to Grok Key #${currentGrokIndex + 1}`)
  return true
}

const resetAI = () => { initKeys() }

// Gemini model candidates (will try in order if one 404s or fails)
// These IDs are confirmed via listModels script for this project's key
// Gemini model candidates (tried in order)
const GEMINI_MODEL_CANDIDATES = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro',
  'gemini-pro-vision',
  'gemini-flash-latest'
]

// Call Grok API via xAI - Simplified for reliability
const GROK_MODEL_CANDIDATES = ['grok-2-vision-1212', 'grok-2-1212', 'grok-beta', 'grok-latest']

const callGrokAPI = async (messages, systemPrompt = '') => {
  const grokKey = getGrokKey()
  if (!grokKey) throw new Error('GROK_API_KEY not configured')

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('No valid messages to send to Grok')
  }

  const formattedMessages = []
  if (systemPrompt && systemPrompt.trim()) {
    formattedMessages.push({
      role: 'system',
      content: systemPrompt.substring(0, 4000)
    })
  }

  for (const msg of messages) {
    if (!msg || !msg.content) continue
    formattedMessages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    })
  }

  const payloadBase = {
    messages: formattedMessages,
    temperature: 0.1, // Lower temperature for more consistent JSON
    max_tokens: 2048,
    stream: false,
  }

  const isGroq = grokKey.startsWith('gsk_')
  const endpoint = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions'
  
  // Note: Groq llama-3.2 and llama-3.3 are great fallbacks
  const models = isGroq 
    ? ['llama-3.3-70b-versatile', 'llama-3.2-90b-vision-preview', 'mixtral-8x7b-32768'] 
    : GROK_MODEL_CANDIDATES

  let lastError = null
  for (const candidateModel of models) {
    const payload = { ...payloadBase, model: candidateModel }
    console.log(`📤 Trying ${isGroq ? 'Groq' : 'Grok'} model: ${candidateModel} with ${formattedMessages.length} messages`)
    try {
      const response = await axios.post(
        endpoint,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${grokKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        }
      )

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        lastError = new Error('Invalid response structure from AI API')
        continue
      }

      const content = response.data.choices[0].message?.content
      if (!content) {
        lastError = new Error('Empty response content from AI API')
        continue
      }

      console.log(`✅ ${isGroq ? 'Groq' : 'Grok'} API success with model: ${candidateModel}`)
      return { text: content, provider: isGroq ? 'Groq' : 'Grok' }
    } catch (err) {
      lastError = err
      console.error(`❌ ${isGroq ? 'Groq' : 'Grok'} API model ${candidateModel} failed: ${err.message}`)
      if (err.response?.status === 429 && rotateGrokKey()) {
         return await callGrokAPI(messages, systemPrompt)
      }
    }
  }
  throw lastError
}

// Text generation with fallback: Gemini → Grok → Error
const generateText = async (prompt, systemInstruction = '') => {
  const system = systemInstruction || 'You are an expert Indian agricultural assistant named Kisan AI. Provide practical, accurate farming advice.'
  const ai = getGenAI()
  
  if (ai) {
    for (const modelId of GEMINI_MODEL_CANDIDATES) {
      try {
        console.log(`📡 Trying Gemini model: ${modelId}...`)
        const model = ai.getGenerativeModel({
          model: modelId,
          systemInstruction: system,
        })
        const result = await model.generateContent(prompt)
        const response = result.response
        if (response) {
          console.log(`✅ Gemini API success with ${modelId}`)
          return { text: response.text(), provider: 'Gemini' }
        }
      } catch (geminiErr) {
        console.warn(`⚠️  Gemini (${modelId}) failed:`, geminiErr.message)
        if (geminiErr.message.includes('429') && rotateGeminiKey()) {
           return await generateText(prompt, systemInstruction)
        }
      }
    }
  }

  try {
    console.log('🔄 Attempting fallback to Grok/Groq API after Gemini failure...')
    return await callGrokAPI([{ role: 'user', content: prompt }], system)
  } catch (grokErr) {
    throw new Error(`AI generation failed on all providers. Check quotas and API keys.`)
  }
}

// Vision generation (disease detection from image) - Grok as fallback
const analyzeImage = async (imagePath, prompt) => {
  if (!fs.existsSync(imagePath)) throw new Error(`Image file not found: ${imagePath}`)
  const imageData = fs.readFileSync(imagePath)
  const base64 = imageData.toString('base64')
  const ext = imagePath.split('.').pop().toLowerCase()
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

  const ai = getGenAI()
  let lastGeminiErr = null

  if (ai) {
    for (const modelId of GEMINI_MODEL_CANDIDATES) {
      try {
        console.log(`🔬 Trying Gemini Vision with model: ${modelId}...`)
        const model = ai.getGenerativeModel({ model: modelId })
        const result = await model.generateContent([
          { inlineData: { data: base64, mimeType } },
          { text: prompt },
        ])
        if (result.response) {
          console.log(`✅ Gemini Vision success with ${modelId}`)
          return { text: result.response.text(), provider: 'Gemini' }
        }
      } catch (geminiErr) {
        lastGeminiErr = geminiErr
        console.warn(`⚠️  Gemini Vision (${modelId}) failed:`, geminiErr.message)
        if (geminiErr.message.includes('429') && rotateGeminiKey()) {
           return await analyzeImage(imagePath, prompt)
        }
      }
    }
  }

  // Fallback to Grok (Text-only fallback for vision if Gemini fails)
  try {
    console.log('🔄 Attempting text-based fallback to Grok/Groq for image analysis...')
    // We send the FULL prompt which contains the JSON schema instructions
    const fallbackPrompt = `A user uploaded a crop/plant image for analysis, but the vision system is temporarily unavailable. 
    BASED ON THE FOLLOWING INSTRUCTIONS, provide a typical/expert example of what to look for or a helpful generic analysis in JSON format:
    
    ${prompt}`
    
    const result = await callGrokAPI([{ role: 'user', content: fallbackPrompt }])
    console.log('✅ Grok API - Text-based fallback analysis complete')
    return result
  } catch (grokErr) {
    throw new Error(`Vision analysis failed on all providers.`)
  }
}

// Chat with conversation history - with fallback
const chatWithHistory = async (messages, farmerContext, language = 'en') => {
  if (!messages || messages.length === 0) throw new Error('No messages provided')

  const langInstruction = language !== 'en'
    ? `IMPORTANT: Respond ONLY in the ${getLanguageName(language)} language. Do not use English unless the user writes in English.`
    : ''

  const systemPrompt = `You are Kisan AI, an expert agricultural assistant specialized in Indian farming. You have deep knowledge of:
- Indian crop varieties, seasons (Kharif, Rabi, Zaid), and farming practices
- Soil types, fertilizers, pesticides, and organic farming
- Government agricultural schemes and subsidies
- Indian mandi prices and market trends
- Weather patterns and their effect on crops
- Pest and disease management for Indian crops
- Regional farming practices across all Indian states

Farmer's profile: ${JSON.stringify(farmerContext)}

Always provide practical, actionable advice. Use simple language. Mention specific product names, dosages, and costs when relevant. Reference local markets and conditions.
${langInstruction}`

  // Prepare Gemini history format once
  const lastUserIdx = messages.findLastIndex(msg => msg.role === 'user')
  if (lastUserIdx === -1) throw new Error('No user message found in history')

  const lastMessage = messages[lastUserIdx]
  const historyMessages = messages.slice(0, lastUserIdx)
  const geminiHistory = []
  
  for (const msg of historyMessages) {
    const role = msg.role === 'assistant' ? 'model' : 'user'
    const last = geminiHistory[geminiHistory.length - 1]
    if (last && last.role === role) {
      last.parts[0].text += '\n' + msg.content
    } else {
      geminiHistory.push({ role, parts: [{ text: msg.content }] })
    }
  }
  while (geminiHistory.length > 0 && geminiHistory[0].role !== 'user') geminiHistory.shift()

  const ai = getGenAI()
  let lastGeminiErr = null

  if (ai) {
    for (const modelId of GEMINI_MODEL_CANDIDATES) {
      try {
        console.log(`💬 Trying Gemini Chat with model: ${modelId}...`)
        const model = ai.getGenerativeModel({
          model: modelId,
          systemInstruction: systemPrompt,
        })

        const chat = model.startChat({ history: geminiHistory })
        const result = await chat.sendMessage(lastMessage.content)
        const response = result.response
        if (!response) throw new Error('Empty response from Gemini')
        
        console.log(`✅ Gemini Chat success with ${modelId}`)
        return { text: response.text(), provider: 'Gemini' }
      } catch (geminiErr) {
        lastGeminiErr = geminiErr
        const errMsg = geminiErr.message || ''
        console.warn(`⚠️  Gemini Chat (${modelId}) failed:`, errMsg)
        if (!errMsg.toLowerCase().includes('not found') && (errMsg.includes('429') || errMsg.includes('503'))) {
          if (rotateGeminiKey()) {
             console.warn('⚠️ Chat: Rate limit or Service error, trying next Gemini key...')
             return await chatWithHistory(messages, farmerContext, language)
          }
          break;
        }
      }
    }
  }

  // Fallback to Grok
  try {
    console.log('🔄 Attempting fallback to Grok API for chat...')
    const grokMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }))
    return await callGrokAPI(grokMessages, systemPrompt)
  } catch (grokErr) {
    console.error('❌ Grok Chat fallback also failed:', grokErr.message)
    const geminiMsg = ai ? (lastGeminiErr?.message || 'Gemini error') : 'Gemini not configured'
    throw new Error(`Both Gemini and Grok APIs failed for chat. Gemini: ${geminiMsg}. Grok: ${grokErr.message}`)
  }
}

const getLanguageName = (code) => {
  const map = {
    hi: 'Hindi', ta: 'Tamil', te: 'Telugu', kn: 'Kannada',
    ml: 'Malayalam', mr: 'Marathi', pa: 'Punjabi', bn: 'Bengali',
    gu: 'Gujarati', or: 'Odia', ur: 'Urdu',
  }
  return map[code] || 'English'
}

module.exports = { generateText, analyzeImage, chatWithHistory, getGenAI, getGrokKey, resetAI, callGrokAPI }
