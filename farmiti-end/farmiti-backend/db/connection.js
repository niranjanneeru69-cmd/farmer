require('dotenv').config()
const mysql = require('mysql2/promise')

// Validate required env vars
const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER']
const missing = requiredVars.filter(v => !process.env[v])
if (missing.length > 0) {
  console.warn(`⚠️  Missing DB env vars: ${missing.join(', ')} — using defaults`)
}

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  database:           process.env.DB_NAME     || 'farmiti_db',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           'local',           // treat fields as local to match NOW()
  dateStrings:        false,
  decimalNumbers:     false,
})

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log(`✅ MySQL connected → ${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'farmiti_db'}`)
    conn.release()
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message)
    console.error('   Check DB_HOST, DB_NAME, DB_USER, DB_PASSWORD in your .env file')
  })

// Convert $1 $2 → ? placeholders for MySQL (PostgreSQL-style support)
const toMySQL = (sql) => sql.replace(/\$\d+/g, '?')

// Strip RETURNING clause (PostgreSQL-only syntax)
const stripReturning = (sql) => sql.replace(/\s+RETURNING\s+[\w\s,.*]+$/i, '')

/**
 * Execute a query with automatic placeholder conversion.
 * Returns { rows, insertId, affectedRows }
 */
const query = async (text, params = []) => {
  const sql = toMySQL(stripReturning(text))
  try {
    const [result] = await pool.execute(sql, params)
    if (Array.isArray(result)) {
      return { rows: result, insertId: null, affectedRows: result.length }
    }
    return { rows: [], insertId: result.insertId || null, affectedRows: result.affectedRows || 0 }
  } catch (err) {
    console.error('❌ DB query error:', err.message, '\n   SQL:', sql.substring(0, 200))
    throw err
  }
}

/**
 * Execute multiple queries in a transaction.
 * Rolls back automatically on error.
 */
const transaction = async (callback) => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const clientQuery = async (text, params = []) => {
      const sql = toMySQL(stripReturning(text))
      const [result] = await conn.execute(sql, params)
      if (Array.isArray(result)) {
        return { rows: result, insertId: null, affectedRows: result.length }
      }
      return { rows: [], insertId: result.insertId || null, affectedRows: result.affectedRows || 0 }
    }

    const result = await callback({ query: clientQuery })
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    console.error('❌ Transaction rolled back:', err.message)
    throw err
  } finally {
    conn.release()
  }
}

module.exports = { query, transaction, pool }
