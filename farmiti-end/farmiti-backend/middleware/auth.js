const jwt = require('jsonwebtoken')
const { query } = require('../db/connection')
const auth = async (req, res, next) => {
  try {
    const h = req.headers.authorization
    if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' })
    const decoded = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET)
    const result = await query('SELECT id, name, phone, email, state, district, avatar_url, language_pref, weather_sms FROM farmers WHERE id=? AND is_active=TRUE', [decoded.id])
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid token' })
    req.farmer = result.rows[0]; next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired. Please login again.' })
    return res.status(401).json({ error: 'Invalid token' })
  }
}
module.exports = auth
