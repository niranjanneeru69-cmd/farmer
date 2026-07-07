require('dotenv').config()
const mysql = require('mysql2/promise')

let poolConfig = {
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           'local',           // treat fields as local to match NOW()
  dateStrings:        false,
  decimalNumbers:     false,
}

const dbUrl = process.env.DATABASE_URL || process.env.JAWSDB_URL || process.env.CLEARDB_DATABASE_URL
let pool

if (dbUrl) {
  try {
    const parsedUrl = new URL(dbUrl)
    poolConfig.host = parsedUrl.hostname
    poolConfig.port = parsedUrl.port ? parseInt(parsedUrl.port) : 3306
    poolConfig.user = decodeURIComponent(parsedUrl.username)
    poolConfig.password = decodeURIComponent(parsedUrl.password)
    poolConfig.database = parsedUrl.pathname.substring(1).split('?')[0] // remove query params if any
    
    // Auto-enable SSL for common production providers (like Aiven or PlanetScale)
    if (dbUrl.includes('aiven') || dbUrl.includes('tidb') || process.env.DB_SSL === 'true') {
      poolConfig.ssl = { rejectUnauthorized: false }
    }
    
    console.log(`🔌 Configuring DB pool from connection string: ${parsedUrl.hostname}/${poolConfig.database}`)
    pool = mysql.createPool(poolConfig)
  } catch (err) {
    console.warn('⚠️ Could not parse DATABASE_URL as URL. Trying direct passing:', err.message)
    pool = mysql.createPool(dbUrl)
  }
} else {
  // Fall back to individual credentials
  poolConfig.host = process.env.DB_HOST || 'localhost'
  poolConfig.port = parseInt(process.env.DB_PORT) || 3306
  poolConfig.database = process.env.DB_NAME || 'farmiti_db'
  poolConfig.user = process.env.DB_USER || 'root'
  poolConfig.password = process.env.DB_PASSWORD || ''
  
  if (process.env.DB_SSL === 'true') {
    poolConfig.ssl = { rejectUnauthorized: false }
  }
  
  pool = mysql.createPool(poolConfig)
}

// Test connection on startup
pool.getConnection()
  .then(conn => {
    const dbTarget = dbUrl ? 'Cloud/URL' : `${poolConfig.host}/${poolConfig.database}`
    console.log(`✅ MySQL connected → ${dbTarget}`)
    conn.release()
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message)
    console.error('   Check DB_HOST, DB_NAME, DB_USER, DB_PASSWORD or DATABASE_URL in your env')
  })

// Pool Reconnection & Error Logging
pool.on('connection', () => {
  console.log('🔄 New database connection established in the pool')
})

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message)
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.warn('🔄 Database connection was closed. Reconnecting...')
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('❌ Database has too many connections.')
  } else if (err.code === 'ECONNREFUSED') {
    console.error('❌ Database connection was refused.')
  }
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
