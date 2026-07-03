const { pool } = require('./connection')

async function migrate() {
  console.log('Migrating database for refinements...')
  try {
    // Add weather_sms to farmers
    const [columnsFarmers] = await pool.query("SHOW COLUMNS FROM farmers LIKE 'weather_sms'")
    if (columnsFarmers.length === 0) {
      await pool.query("ALTER TABLE farmers ADD COLUMN weather_sms BOOLEAN DEFAULT FALSE")
      console.log('✅ Added weather_sms to farmers')
    }

    // Add link to notifications
    const [columnsNotifs] = await pool.query("SHOW COLUMNS FROM notifications LIKE 'link'")
    if (columnsNotifs.length === 0) {
      await pool.query("ALTER TABLE notifications ADD COLUMN link TEXT")
      console.log('✅ Added link to notifications')
    }

    console.log('🚀 Migration complete!')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
  } finally {
    process.exit(0)
  }
}

migrate()
