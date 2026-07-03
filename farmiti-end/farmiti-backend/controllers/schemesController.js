const { query } = require('../db/connection')

const getSchemes = async (req, res) => {
  try {
    const { category } = req.query
    let sql = `SELECT s.*, CASE WHEN se.farmer_id IS NOT NULL THEN se.status ELSE NULL END AS enrollment_status, se.enrolled_at
      FROM schemes s LEFT JOIN scheme_enrollments se ON se.scheme_id=s.id AND se.farmer_id=? WHERE s.is_active=TRUE`
    const params = [req.farmer.id]
    if (category && category !== 'All') { params.push(category); sql += ` AND s.category=?` }
    sql += ' ORDER BY s.id'
    const result = await query(sql, params)
    res.json({ schemes: result.rows })
  } catch (err) { res.status(500).json({ error: 'Failed to fetch schemes' }) }
}

const getEnrollments = async (req, res) => {
  try {
    const result = await query(
      `SELECT se.*, s.name, s.full_name, s.category, s.amount, s.img_url, s.ministry
       FROM scheme_enrollments se JOIN schemes s ON s.id=se.scheme_id WHERE se.farmer_id=? ORDER BY se.enrolled_at DESC`,
      [req.farmer.id]
    )
    res.json({ enrollments: result.rows })
  } catch (err) { res.status(500).json({ error: 'Failed to fetch enrollments' }) }
}

const getScheme = async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, CASE WHEN se.farmer_id IS NOT NULL THEN se.status ELSE NULL END AS enrollment_status, se.enrolled_at
       FROM schemes s LEFT JOIN scheme_enrollments se ON se.scheme_id=s.id AND se.farmer_id=? WHERE s.id=?`,
      [req.farmer.id, req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Scheme not found' })
    res.json({ scheme: result.rows[0] })
  } catch (err) { res.status(500).json({ error: 'Failed to fetch scheme' }) }
}

const enrollScheme = async (req, res) => {
  try {
    const existing = await query('SELECT id, status FROM scheme_enrollments WHERE farmer_id=? AND scheme_id=?', [req.farmer.id, req.params.id])
    if (existing.rows.length) return res.status(409).json({ error: `Already enrolled with status: ${existing.rows[0].status}` })

    const ins = await query(
      "INSERT INTO scheme_enrollments (farmer_id, scheme_id, status, notes) VALUES (?,?,'searched',?)",
      [req.farmer.id, req.params.id, req.body.notes || null]
    )
    const enrollment = await query('SELECT * FROM scheme_enrollments WHERE id=?', [ins.insertId])
    res.status(201).json({ message: 'Search logged!', enrollment: enrollment.rows[0] })
  } catch (err) {
    console.error('enrollScheme error:', err)
    res.status(500).json({ error: 'Failed to enroll' })
  }
}

const deleteEnrollment = async (req, res) => {
  try {
    const result = await query('DELETE FROM scheme_enrollments WHERE id=? AND farmer_id=?', [req.params.id, req.farmer.id])
    if (!result.affectedRows) return res.status(404).json({ error: 'Enrollment not found' })
    res.json({ message: 'Enrollment deleted' })
  } catch (err) { res.status(500).json({ error: 'Failed to delete' }) }
}

module.exports = { getSchemes, getScheme, enrollScheme, getEnrollments, deleteEnrollment }
