const { query } = require('../db/connection')
const gemini = require('./geminiHelper')

// Simulate live price variation (±3% from stored price)
const livePrice = (basePrice) => {
  const variation = (Math.random() - 0.5) * 0.06
  return Math.round(basePrice * (1 + variation))
}

// GET /api/market/prices
const getPrices = async (req, res) => {
  try {
    const { search, category, state, nearby } = req.query
    let sql = 'SELECT * FROM market_prices WHERE 1=1'
    const params = []

    if (nearby === 'true' && req.farmer.district) {
      params.push(`%${req.farmer.district}%`)
      sql += ` AND (LOWER(market) LIKE LOWER(?) OR LOWER(state) LIKE LOWER(?))`
      params.push(`%${req.farmer.state || ''}%`)
    }

    if (search) { params.push(`%${search}%`); sql += ` AND LOWER(crop_name) LIKE LOWER(?)` }
    if (category && category !== 'All') { params.push(category); sql += ` AND category = ?` }
    if (state && state !== 'All') { params.push(`%${state}%`); sql += ` AND state LIKE ?` }
    sql += ' ORDER BY category, crop_name'

    const result = await query(sql, params)

    // Apply live price simulation and MSP calculation
    const prices = result.rows.map(row => {
      const currentPrice = livePrice(row.price)
      // MSP is typically slightly lower than average market price for simulation
      const msp = Math.round(row.price * 0.85)
      return {
        ...row,
        price: currentPrice,
        msp: msp,
        change: row.prev_price ? parseFloat(((currentPrice - row.prev_price) / row.prev_price * 100).toFixed(1)) : 0,
        last_updated: new Date().toISOString(),
      }
    })

    res.json({ prices, updated_at: new Date().toISOString() })
  } catch (err) {
    console.error('getPrices error:', err)
    res.status(500).json({ error: 'Failed to fetch prices' })
  }
}

// GET /api/market/prices/:id/history
const getPriceHistory = async (req, res) => {
  try {
    const result = await query(
      `SELECT ph.price, ph.recorded_at, mp.crop_name
       FROM price_history ph JOIN market_prices mp ON mp.id = ph.crop_id
       WHERE ph.crop_id = ? ORDER BY ph.recorded_at ASC`,
      [req.params.id]
    )
    res.json({ history: result.rows })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch price history' })
  }
}

// GET /api/market/categories
const getCategories = async (req, res) => {
  try {
    const result = await query('SELECT DISTINCT category FROM market_prices ORDER BY category')
    res.json({ categories: result.rows.map(r => r.category) })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
}

// GET /api/market/top-movers — biggest price changes today
const getTopMovers = async (req, res) => {
  try {
    const result = await query('SELECT * FROM market_prices ORDER BY ABS(price - prev_price) DESC LIMIT 10')
    const movers = result.rows.map(row => ({
      ...row,
      change: row.prev_price ? parseFloat(((row.price - row.prev_price) / row.prev_price * 100).toFixed(1)) : 0,
    }))
    res.json({ movers })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top movers' })
  }
}

// POST /api/market/analyze
const analyzeMarket = async (req, res) => {
  try {
    const { cropId, cropName, currentPrice, history } = req.body
    if (!cropId || !cropName) return res.status(400).json({ error: 'Crop details required' })

    const prompt = `
      You are a Market Analyst for Kisan AI. Analyze the following market data for ${cropName}:
      - Current Price: ₹${currentPrice}
      - Recent History: ${JSON.stringify(history)}
      
      Provide a JSON response with:
      1. sentiment: "Bullish", "Bearish", or "Stable"
      2. action: "Sell Now", "Wait for 1 Week", or "Hold"
      3. logic: A brief 2-sentence explanation for the farmer.
      4. forecast: An array of 7 projected prices for the next 7 days.
      5. confidence: A number 1-100.
      
      Respond ONLY with valid JSON.
    `
    
    console.log(`🤖 Analyzing market for ${cropName}...`)
    const result = await gemini.generateText(prompt, 'You are a professional agricultural market analyst.')
    
    // Safety parse
    let analysis
    try {
      const cleanJson = result.text.replace(/```json|```/g, '').trim()
      analysis = JSON.parse(cleanJson)
    } catch (e) {
      // Fallback if AI output isn't clean JSON
      analysis = {
        sentiment: "Stable",
        action: "Hold",
        logic: result.text.substring(0, 200),
        forecast: Array(7).fill(currentPrice),
        confidence: 50
      }
    }

    res.json({ analysis })
  } catch (err) {
    console.error('analyzeMarket error:', err)
    res.status(500).json({ error: 'Market analysis failed' })
  }
}

module.exports = { getPrices, getPriceHistory, getCategories, getTopMovers, analyzeMarket }
