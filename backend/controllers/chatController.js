const { query } = require('../db/connection')
const { chatWithHistory, getGenAI, getGrokKey } = require('./geminiHelper')

// POST /api/chat/message
const sendMessage = async (req, res) => {
  try {
    const { message, language } = req.body
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' })

    // Save user message to DB
    await query(
      'INSERT INTO chat_messages (farmer_id, role, content) VALUES (?,?,?)',
      [req.farmer.id, 'user', message.trim()]
    )

    // Get last 20 messages for context (ordered ASC so history is chronological)
    const histResult = await query(
      'SELECT role, content FROM chat_messages WHERE farmer_id=? ORDER BY created_at ASC LIMIT 20',
      [req.farmer.id]
    )
    const history = histResult.rows  // already in ASC order

    // Get farmer context for personalized advice
    const profileResult = await query(
      `SELECT f.name, f.state, f.district, f.language_pref,
              fd.soil_type, fd.land_size, fd.water_source, fd.primary_crop
       FROM farmers f LEFT JOIN farm_details fd ON fd.farmer_id = f.id
       WHERE f.id = ?`,
      [req.farmer.id]
    )
    const farmerContext = profileResult.rows[0] || {}
    const lang = language || farmerContext.language_pref || 'en'

    let reply
    let aiProvider = null
    const geminiAvailable = !!getGenAI()
    const grokAvailable = !!getGrokKey()
    const aiAvailable = geminiAvailable || grokAvailable

    if (!aiAvailable) {
      console.warn('⚠️  No AI keys configured — using fallback responses')
      reply = getFallbackResponse(message)
    } else {
      try {
        const aiResult = await chatWithHistory(history, farmerContext, lang)
        reply = aiResult.text
        aiProvider = aiResult.provider || (geminiAvailable ? 'Gemini' : 'Grok')
        console.log(`✅ AI chat response generated (provider: ${aiProvider})`)
      } catch (err) {
        console.error('❌ AI chat error:', err.message)
        const errMsg = err.message || ''
        
        // Specific error messages for debugging and user feedback
        if (errMsg.includes('Both Gemini and Grok APIs failed')) {
          console.log('⚠️  Both AI providers unavailable (quota/error) — using fallback')
          if (errMsg.includes('429') || errMsg.includes('quota')) {
            reply = '⏳ **AI Service Quota Exceeded**\n\nBoth Gemini and Grok APIs have reached their limits. You can:\n\n1. **Retry in ~15 minutes** when quota resets\n2. **Upgrade your API plans** for higher limits\n3. **Use local farming advice** below\n\n' + getFallbackResponse(message)
          } else {
            reply = '⚠️ AI service temporarily unavailable. Please try again in a moment.\n\n' + getFallbackResponse(message)
          }
        } else if (errMsg.includes('401') || errMsg.includes('unauthorized') || errMsg.includes('API key not valid')) {
          console.error('❌ Invalid AI API keys — check GEMINI_API_KEY and GROK_API_KEY in .env')
          reply = '⚠️ AI service configuration error. Please contact support.\n\n' + getFallbackResponse(message)
        } else if (errMsg.includes('503')) {
          console.log('⚠️  AI APIs temporarily overloaded (503 Service Unavailable)')
          reply = '🔧 **AI APIs Temporarily Overloaded**\n\nServices are experiencing high demand. Please retry in ~1 minute.\n\nMeanwhile, here\'s local farming guidance:\n\n' + getFallbackResponse(message)
        } else {
          reply = '⚠️ AI service temporarily unavailable. Here\'s local farming guidance:\n\n' + getFallbackResponse(message)
        }
      }
    }

    // Save assistant reply to DB
    await query(
      'INSERT INTO chat_messages (farmer_id, role, content) VALUES (?,?,?)',
      [req.farmer.id, 'assistant', reply]
    )

    res.json({ reply, ai_powered: aiAvailable, ai_provider: aiProvider })
  } catch (err) {
    console.error('sendMessage error:', err)
    res.status(500).json({ error: 'Failed to process message. Please try again.' })
  }
}

// GET /api/chat/history
const getChatHistory = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, role, content, created_at FROM chat_messages WHERE farmer_id=? ORDER BY created_at ASC LIMIT 100',
      [req.farmer.id]
    )
    res.json({ messages: result.rows })
  } catch (err) {
    console.error('getChatHistory error:', err)
    res.status(500).json({ error: 'Failed to fetch chat history' })
  }
}

// DELETE /api/chat/history
const clearChatHistory = async (req, res) => {
  try {
    await query('DELETE FROM chat_messages WHERE farmer_id=?', [req.farmer.id])
    res.json({ message: 'Chat history cleared' })
  } catch (err) {
    console.error('clearChatHistory error:', err)
    res.status(500).json({ error: 'Failed to clear history' })
  }
}

// Fallback responses when Gemini API is unavailable
const getFallbackResponse = (message) => {
  const lower = (message || '').toLowerCase()

  if (lower.includes('fertilizer') || lower.includes('urea') || lower.includes('dap'))
    return `**Fertilizer Guide:**\n\n**Basal (at sowing):** Urea 100kg/ha + DAP 125kg/ha + MOP 75kg/ha\n\n**Top dressing:** Apply Urea in 2 splits (30 days + flowering)\n\n💡 Add your GEMINI_API_KEY to .env for AI-powered personalized advice!`

  if (lower.includes('pest') || lower.includes('insect') || lower.includes('bug'))
    return `**Pest Management:**\n\n- Spray Neem oil (5ml/L) as organic option\n- For severe attacks: Imidacloprid 17.8SL (0.5ml/L)\n- Install pheromone traps for monitoring\n\n💡 Add GEMINI_API_KEY for specific pest identification!`

  if (lower.includes('disease') || lower.includes('spot') || lower.includes('yellow') || lower.includes('blight'))
    return `**Disease Advisory:**\n\n- Yellow spots: Apply Mancozeb 75WP (2.5g/L)\n- Wilting: Check for root rot, improve drainage\n- Upload photo in Disease Detection for AI diagnosis!\n\n💡 Add GEMINI_API_KEY for detailed AI analysis!`

  if (lower.includes('weather') || lower.includes('rain') || lower.includes('monsoon'))
    return `**Weather Tips:**\n\n- Check the Weather page for real-time forecasts\n- Pre-monsoon: Apply systemic fungicide to prevent fungal diseases\n- During heavy rain: Open drainage channels, avoid spraying\n\n💡 Add GEMINI_API_KEY for personalized weather-based advice!`

  if (lower.includes('market') || lower.includes('price') || lower.includes('sell'))
    return `**Market Advisory:**\n\n- Check the Market Prices page for live mandi rates\n- Best time to sell: 2-3 weeks after peak harvest season\n- Store grains at <14% moisture to get better prices\n\n💡 Add GEMINI_API_KEY for AI market timing advice!`

  return `**Kisan AI Assistant**\n\nI can help with:\n- 🌱 Crop advice & fertilizers\n- 🐛 Pest & disease management\n- 💰 Market timing strategies\n- 🌧️ Weather-based farming tips\n- 📋 Government scheme guidance\n\n⚠️ For full AI-powered responses, add your **GEMINI_API_KEY** to the .env file.\nGet a free key at: https://aistudio.google.com/app/apikey`
}

module.exports = { sendMessage, getChatHistory, clearChatHistory }
