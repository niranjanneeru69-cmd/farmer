require('dotenv').config()
const { pool } = require('./connection')

async function up() {
  console.log('Migrating calendar_events table...')
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        farmer_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        event_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        description TEXT,
        type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'upcoming',
        reminder_mins INT DEFAULT 10,
        notified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4;
    `)
    console.log('✅ Created calendar_events table successfully')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
  } finally {
    process.exit(0)
  }
}

up()
