const { query } = require('../db/connection')

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, type, title, message, link, data, is_read, created_at FROM notifications WHERE farmer_id=? ORDER BY created_at DESC LIMIT 50',
      [req.farmer.id]
    )
    const unread = result.rows.filter(n => !n.is_read).length
    res.json({ notifications: result.rows, unread_count: unread })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
}

// PUT /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read=TRUE WHERE id=? AND farmer_id=?', [req.params.id, req.farmer.id])
    res.json({ message: 'Marked as read' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' })
  }
}

// PUT /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read=TRUE WHERE farmer_id=?', [req.farmer.id])
    res.json({ message: 'All notifications marked as read' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' })
  }
}

// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const result = await query('DELETE FROM notifications WHERE id=? AND farmer_id=?', [req.params.id, req.farmer.id])
    if (!result.affectedRows) return res.status(404).json({ error: 'Notification not found' })
    res.json({ message: 'Notification deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' })
  }
}

// DELETE /api/notifications/clear-all
const clearAll = async (req, res) => {
  try {
    await query('DELETE FROM notifications WHERE farmer_id=?', [req.farmer.id])
    res.json({ message: 'All notifications cleared' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear' })
  }
}

// POST /api/notifications (internal — create notification)
const createNotification = async (farmerId, type, title, message, link = null, data = null) => {
  try {
    await query(
      'INSERT INTO notifications (farmer_id, type, title, message, link, data) VALUES (?,?,?,?,?,?)',
      [farmerId, type, title, message, link, data ? JSON.stringify(data) : null]
    )
  } catch (err) {
    console.error('createNotification error:', err.message)
  }
}

module.exports = { getNotifications, markRead, markAllRead, deleteNotification, clearAll, createNotification }
