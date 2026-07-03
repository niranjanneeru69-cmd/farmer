const { query } = require('../db/connection')

const getFullHistory = async (req, res) => {
  try {
    const { type } = req.query; const farmerId = req.farmer.id; const items = []
    if (!type || type==='crops') {
      const r = await query('SELECT id,"crop_recommendation" AS type, soil_type, ph, rainfall, area, season, irrigation, recommendations, created_at FROM crop_recommendation_history WHERE farmer_id=? ORDER BY created_at DESC LIMIT 20', [farmerId])
      r.rows.forEach(x => items.push({...x, category:'Crop Recommendation'}))
    }
    if (!type || type==='disease') {
      const r = await query('SELECT id,"disease_detection" AS type, crop_name, disease_name, confidence, severity, image_url, treatment_status, analysis_result, created_at FROM disease_detections WHERE farmer_id=? ORDER BY created_at DESC LIMIT 20', [farmerId])
      r.rows.forEach(x => items.push({...x, category:'Disease Detection'}))
    }
    if (!type || type==='schemes') {
      const r = await query('SELECT se.id,"scheme_enrollment" AS type, s.name AS scheme_name, s.category AS scheme_category, s.amount, se.status, se.enrolled_at AS created_at FROM scheme_enrollments se JOIN schemes s ON s.id=se.scheme_id WHERE se.farmer_id=? ORDER BY se.enrolled_at DESC LIMIT 20', [farmerId])
      r.rows.forEach(x => items.push({...x, category:'Scheme Enrollment'}))
    }
    if (!type || type==='weather') {
      const r = await query('SELECT id,"weather_alert" AS type, title, severity, area, is_read, created_at FROM weather_alerts WHERE farmer_id=? ORDER BY created_at DESC LIMIT 20', [farmerId])
      r.rows.forEach(x => items.push({...x, category:'Weather Alert'}))
    }
    items.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
    res.json({ history: items, total: items.length })
  } catch (err) { res.status(500).json({ error: 'Failed to fetch history' }) }
}

const getSummary = async (req, res) => {
  try {
    const id = req.farmer.id
    const [c,d,s,n] = await Promise.all([
      query('SELECT COUNT(*) AS cnt FROM crop_recommendation_history WHERE farmer_id=?', [id]),
      query('SELECT COUNT(*) AS cnt FROM disease_detections WHERE farmer_id=?', [id]),
      query('SELECT COUNT(*) AS cnt FROM scheme_enrollments WHERE farmer_id=?', [id]),
      query('SELECT COUNT(*) AS cnt FROM notifications WHERE farmer_id=? AND is_read=FALSE', [id]),
    ])
    res.json({ crop_recommendations:parseInt(c.rows[0]?.cnt||0), disease_detections:parseInt(d.rows[0]?.cnt||0), scheme_enrollments:parseInt(s.rows[0]?.cnt||0), unread_alerts:parseInt(n.rows[0]?.cnt||0) })
  } catch (err) { res.status(500).json({ error: 'Failed to fetch summary' }) }
}

const deleteHistoryItem = async (req, res) => {
  try {
    const { type, id } = req.params; const farmerId = req.farmer.id
    const tableMap = { crops:'crop_recommendation_history', disease:'disease_detections', schemes:'scheme_enrollments', weather:'weather_alerts' }
    const table = tableMap[type]
    if (!table) return res.status(400).json({ error: 'Invalid type' })
    const col = type==='schemes' ? 'farmer_id' : 'farmer_id'
    await query(`DELETE FROM ${table} WHERE id=? AND ${col}=?`, [id, farmerId])
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ error: 'Failed to delete' }) }
}

const clearHistory = async (req, res) => {
  try {
    const { type } = req.params; const farmerId = req.farmer.id
    const tableMap = { crops:'crop_recommendation_history', disease:'disease_detections', weather:'weather_alerts', schemes: 'scheme_enrollments' }
    const table = tableMap[type]
    if (!table) return res.status(400).json({ error: 'Invalid type' })
    await query(`DELETE FROM ${table} WHERE farmer_id=?`, [farmerId])
    res.json({ message: 'History cleared' })
  } catch (err) { res.status(500).json({ error: 'Failed to clear' }) }
}

const clearAllHistory = async (req, res) => {
  try {
    const farmerId = req.farmer.id
    await Promise.all([
      query('DELETE FROM crop_recommendation_history WHERE farmer_id=?', [farmerId]),
      query('DELETE FROM disease_detections WHERE farmer_id=?', [farmerId]),
      query('DELETE FROM scheme_enrollments WHERE farmer_id=?', [farmerId]),
      query('DELETE FROM weather_alerts WHERE farmer_id=?', [farmerId]),
    ])
    res.json({ message: 'All history cleared' })
  } catch (err) { res.status(500).json({ error: 'Failed to clear all history' }) }
}

module.exports = { getFullHistory, getSummary, deleteHistoryItem, clearHistory, clearAllHistory }
