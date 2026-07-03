const { query } = require('./connection');

async function migrate() {
  console.log('🚀 Starting Geographic migration...');
  try {
    // Add latitude and longitude to farm_details
    await query(`
      ALTER TABLE farm_details 
      ADD COLUMN latitude DECIMAL(10, 8),
      ADD COLUMN longitude DECIMAL(11, 8),
      ADD COLUMN soil_report JSON
    `);
    
    console.log('✅ Columns latitude, longitude, and soil_report added to farm_details');
    
    // Seed some example data for the current user if they exist
    const farmers = await query('SELECT id FROM farmers LIMIT 5');
    for (const f of farmers.rows) {
      // Chennai coordinates roughly: 13.0827, 80.2707
      const lat = 13.0827 + (Math.random() - 0.5) * 0.1;
      const lon = 80.2707 + (Math.random() - 0.5) * 0.1;
      const soil = {
        ph: 6.5,
        nitrogen: "Medium",
        phosphorus: "High",
        potassium: "Low",
        organic_carbon: "0.5%",
        last_tested: new Date().toISOString()
      };
      
      await query(
        'UPDATE farm_details SET latitude = ?, longitude = ?, soil_report = ? WHERE farmer_id = ?',
        [lat, lon, JSON.stringify(soil), f.id]
      );
    }
    
    console.log('✅ Geo data seeded for existing farmers');
  } catch (err) {
    if (err.message.includes('Duplicate column name')) {
      console.log('ℹ️  Geo columns already exist');
    } else {
      console.error('❌ Migration failed:', err.message);
    }
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0));
}

module.exports = migrate;
