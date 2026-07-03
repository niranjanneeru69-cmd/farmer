const { query } = require('../db/connection')
const { generateText, getGenAI, getGrokKey } = require('./geminiHelper')

const buildCropPrompt = (params, lang = 'en') => {
  const { soil_type, area, rainfall, ph, season, irrigation, state, district } = params
  return `You are an expert Indian agricultural advisor. Based on the following farm conditions, recommend the top 5 most suitable crops.

IMPORTANT LANGUAGE INSTRUCTION:
You MUST respond entirely in the language code: "${lang}".
Whenever you mention a crop name, disease, or technical term, ALWAYS format it as: TranslatedName (EnglishName). 
Example in Telugu for Cotton: పత్తి (Cotton). Follow this bracket format strictly for ALL crop names.


Farm Details:
- Location: ${district || 'Not specified'}, ${state || 'Tamil Nadu'}, India
- Soil Type: ${soil_type || 'Clay Loam'}
- Farm Area: ${area || 5} acres
- Annual Rainfall: ${rainfall || 800} mm
- Soil pH: ${ph || 6.5}
- Season: ${season || 'Kharif (Jun-Oct)'}
- Irrigation Source: ${irrigation || 'Canal'}

Respond with ONLY a valid JSON array (no markdown, no explanation, no code fences):
[
  {
    "rank": 1,
    "name": "crop name",
    "category": "Cereal/Pulse/Vegetable/Cash Crop/Oilseed/Spice/Fruit",
    "score": 92,
    "season": "best season",
    "duration": "X days",
    "water": "Low/Medium/High",
    "profit_per_acre": 45000,
    "img_url": "https://images.unsplash.com/photo-1536304993881-ff86e0c9ef82?w=400&q=80",
    "reasons": ["reason 1", "reason 2", "reason 3"],
    "tips": "specific expert tip for this farmer",
    "fertilizer_schedule": "brief fertilizer recommendation",
    "best_variety": "best variety for this region",
    "market_demand": "High/Medium/Low"
  }
]

Provide exactly 5 crops. Use realistic Indian mandi profit estimates. Be specific to the region. Return ONLY the JSON array, nothing else.`
}

// POST /api/crops/recommend
const getRecommendations = async (req, res) => {
  try {
    const { soil_type, area, rainfall, ph, season, irrigation } = req.body

    // Get farmer's location for better recommendations
    const profileRes = await query(
      'SELECT state, district, language_pref FROM farmers WHERE id=?',
      [req.farmer.id]
    )
    const { state, district, language_pref } = profileRes.rows[0] || {}
    const lang = language_pref || 'en'

    let recommendations
    let aiProvider = null
    const geminiAvailable = !!getGenAI()
    const grokAvailable = !!getGrokKey()
    const aiAvailable = geminiAvailable || grokAvailable

    if (!aiAvailable) {
      console.warn('⚠️  No AI keys configured (GEMINI_API_KEY & GROK_API_KEY) — using local recommendations')
      recommendations = getLocalRecommendations({ soil_type, ph: parseFloat(ph), rainfall: parseFloat(rainfall), season, irrigation })
    } else {
      try {
        console.log('🌱 Fetching AI crop recommendations (Gemini primary, Grok fallback)...')
        const aiResult = await generateText(buildCropPrompt({ soil_type, area, rainfall, ph, season, irrigation, state, district }, lang))
        const raw = aiResult.text
        const provider = aiResult.provider || (geminiAvailable ? 'Gemini' : 'Grok')

        // Extract JSON — AI sometimes wraps in markdown code fences
        const cleaned = raw
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim()

        const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
        if (!jsonMatch) throw new Error('No JSON array found in AI response')

        const parsed = JSON.parse(jsonMatch[0])
        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Empty recommendations array')

        recommendations = parsed.map((c, i) => ({ ...c, rank: c.rank || i + 1 }))
        aiProvider = provider
        console.log(`✅ ${provider} AI generated ${recommendations.length} crop recommendations`)
      } catch (err) {
        console.error('❌ AI crop recommendation error:', err.message)
        const errMsg = err.message || ''
        
        if (errMsg.includes('Both Gemini and Grok APIs failed')) {
          console.log('⚠️  Both AI providers failed — using local fallback recommendations')
          if (errMsg.includes('429') || errMsg.includes('quota')) {
            console.log('📊 Reason: API quota exceeded on both providers')
          }
        } else if (errMsg.includes('401') || errMsg.includes('unauthorized')) {
          console.error('❌ Invalid API keys — check GEMINI_API_KEY and GROK_API_KEY in .env')
        }
        
        recommendations = getLocalRecommendations({ soil_type, ph: parseFloat(ph), rainfall: parseFloat(rainfall), season, irrigation })
      }
    }

    // Save to history (MySQL JSON column)
    await query(
      `INSERT INTO crop_recommendation_history
        (farmer_id, soil_type, area, rainfall, ph, season, irrigation, recommendations)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        req.farmer.id,
        soil_type || null,
        area ? parseFloat(area) : null,
        rainfall ? parseFloat(rainfall) : null,
        ph ? parseFloat(ph) : null,
        season || null,
        irrigation || null,
        JSON.stringify(recommendations),
      ]
    )

    res.json({ recommendations, ai_powered: aiAvailable, ai_provider: aiProvider })
  } catch (err) {
    console.error('getRecommendations error:', err)
    res.status(500).json({ error: 'Failed to get recommendations' })
  }
}

// GET /api/crops/history
const getRecommendationHistory = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM crop_recommendation_history WHERE farmer_id=? ORDER BY created_at DESC LIMIT 20',
      [req.farmer.id]
    )
    // Parse JSON field if it came back as string
    const history = result.rows.map(row => ({
      ...row,
      recommendations: typeof row.recommendations === 'string'
        ? JSON.parse(row.recommendations)
        : row.recommendations,
    }))
    res.json({ history })
  } catch (err) {
    console.error('getRecommendationHistory error:', err)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
}

// DELETE /api/crops/history/:id
const deleteHistory = async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM crop_recommendation_history WHERE id=? AND farmer_id=?',
      [req.params.id, req.farmer.id]
    )
    if (!result.affectedRows) return res.status(404).json({ error: 'Record not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    console.error('deleteHistory error:', err)
    res.status(500).json({ error: 'Failed to delete' })
  }
}

// Fallback recommendations when Gemini key is unavailable
const getLocalRecommendations = ({ soil_type, ph, rainfall, season, irrigation }) => {
  const all = [
    {
      name: 'Samba Rice', category: 'Cereal', score: 94,
      season: 'Kharif (Jun–Oct)', duration: '135 days', water: 'High',
      profit_per_acre: 45000,
      img_url: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9ef82?w=400&q=80',
      reasons: ['Ideal for clay-loam soil', 'Excellent MSP support', 'High demand in South India'],
      tips: 'Use SRI method for 20% better yield. Apply 120kg N/ha in 3 splits.',
      fertilizer_schedule: 'Basal: DAP 125kg/ha. Top-dress Urea at 30 & 60 days.',
      best_variety: 'ADT 43', market_demand: 'High',
    },
    {
      name: 'Cotton', category: 'Cash Crop', score: 87,
      season: 'Kharif (Jun–Oct)', duration: '160 days', water: 'Medium',
      profit_per_acre: 52000,
      img_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
      reasons: ['Good for black cotton soil', 'High MSP', 'Strong export market'],
      tips: 'Use Bt cotton for bollworm resistance. Drip irrigation saves 40% water.',
      fertilizer_schedule: 'N:P:K = 120:60:60 kg/ha in splits.',
      best_variety: 'MCU 5', market_demand: 'High',
    },
    {
      name: 'Groundnut', category: 'Oilseed', score: 85,
      season: 'Kharif (Jun–Oct)', duration: '105 days', water: 'Medium',
      profit_per_acre: 38000,
      img_url: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=80',
      reasons: ['Sandy loam soil ideal', 'Good export demand', 'Oil mill linkage'],
      tips: 'Apply gypsum 200kg/ha at peg formation stage.',
      fertilizer_schedule: 'Basal: SSP 375kg/ha. Foliar: 2% DAP at flowering.',
      best_variety: 'TMV 7', market_demand: 'Medium',
    },
    {
      name: 'Turmeric', category: 'Spice', score: 82,
      season: 'Kharif (Jun–Oct)', duration: '240 days', water: 'High',
      profit_per_acre: 70000,
      img_url: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&q=80',
      reasons: ['Erode is world largest market', 'Excellent storage', 'High value crop'],
      tips: 'Raised beds improve drainage. Shade during summer increases yield.',
      fertilizer_schedule: 'FYM 25t/ha + N:P:K = 60:50:120 kg/ha.',
      best_variety: 'BSR 2', market_demand: 'High',
    },
    {
      name: 'Green Gram', category: 'Pulse', score: 78,
      season: 'Rabi (Oct–Feb)', duration: '65 days', water: 'Low',
      profit_per_acre: 22000,
      img_url: 'https://images.unsplash.com/photo-1593280359364-8d6b8b9c4b16?w=400&q=80',
      reasons: ['Short duration', 'Fixes nitrogen', 'Low water requirement'],
      tips: 'Inoculate with Rhizobium before sowing. Can be used as green manure.',
      fertilizer_schedule: 'Basal: DAP 50kg/ha. No top-dressing needed.',
      best_variety: 'Co 6', market_demand: 'Medium',
    },
  ]
  return all.map((c, i) => ({ ...c, rank: i + 1 }))
}

module.exports = { getRecommendations, getRecommendationHistory, deleteHistory }
