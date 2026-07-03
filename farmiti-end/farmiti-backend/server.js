require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const path    = require('path')

// ── Startup diagnostics ────────────────────────────────────────────────────
const checkEnv = () => {
  const checks = {
    'MySQL DB':      process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER,
    'JWT Secret':    process.env.JWT_SECRET && process.env.JWT_SECRET !== 'farmiti_super_secret_key_change_this_2025',
    'Gemini AI':     process.env.GEMINI_API_KEYS && process.env.GEMINI_API_KEYS !== 'your_gemini_api_key_here',
    'Grok AI':       process.env.GROK_API_KEYS && process.env.GROK_API_KEYS !== 'your_grok_api_key_here',
    'OpenWeather':   process.env.OPENWEATHER_API_KEY && process.env.OPENWEATHER_API_KEY !== 'your_openweathermap_api_key_here',
  }
  console.log('\n📋 Environment Check:')
  Object.entries(checks).forEach(([k, ok]) =>
    console.log(`   ${ok ? '✅' : '❌'} ${k}${ok ? '' : ' — NOT configured (check .env)'}`)
  )
  console.log('')
}
checkEnv()
// ──────────────────────────────────────────────────────────────────────────

const app = express()

// CORS — allow frontend origin
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
]
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: Origin ${origin} not allowed`))
  },
  credentials: true,
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'))
app.use('/api/farmer',        require('./routes/farmer'))
app.use('/api/weather',       require('./routes/weather'))
app.use('/api/market',        require('./routes/market'))
app.use('/api/crops',         require('./routes/crops'))
app.use('/api/disease',       require('./routes/disease'))
app.use('/api/schemes',       require('./routes/schemes'))
app.use('/api/chat',          require('./routes/chat'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/history',       require('./routes/history'))
app.use('/api/calendar',      require('./routes/calendar'))

// ── Public Pincode Lookup (no auth needed) ─────────────────────────────────
const fetch = require('node-fetch')
app.get('/api/pincode/:pin', async (req, res) => {
  const { pin } = req.params
  if (!/^\d{6}$/.test(pin)) return res.status(400).json({ error: 'Invalid pincode' })

  // Try primary API
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: controller.signal })
    clearTimeout(timeout)
    const data = await r.json()
    if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length) {
      const offices = data[0].PostOffice
      const po = offices[0]
      
      const clean = (val) => {
        if (!val || val.toLowerCase() === 'n.a.' || val.toLowerCase() === 'not applicable' || val.toLowerCase() === 'na') return ''
        return val.trim()
      }

      const block = clean(po.Block)
      const division = clean(po.Division)
      const district = clean(po.District)
      const city = block || division || district

      return res.json({
        success: true,
        state: po.State,
        district: district,
        city: city,
        village: clean(po.Name),
        region: clean(po.Region),
        all_offices: offices.map(o => ({ 
          name: clean(o.Name), 
          block: clean(o.Block), 
          division: clean(o.Division),
          district: clean(o.District)
        }))
      })
    }
  } catch (e) {
    console.warn('Primary pincode API failed:', e.message)
  }

  // Fallback: Use OpenWeatherMap geocoding if available
  try {
    const apiKey = (process.env.OPENWEATHER_API_KEY || '').trim()
    if (apiKey) {
      const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/zip?zip=${pin},IN&appid=${apiKey}`)
      if (geoRes.ok) {
        const geoData = await geoRes.json()
        if (geoData?.name) {
          return res.json({
            success: true,
            state: '',
            district: '',
            city: geoData.name,
            village: geoData.name,
            lat: geoData.lat,
            lon: geoData.lon,
            source: 'openweather_geo'
          })
        }
      }
    }
  } catch (e2) {
    console.warn('OWM geo fallback failed:', e2.message)
  }

  res.json({ success: false, error: 'Could not resolve pincode' })
})

// ── Background Cron Jobs (Reminders) ──────────────────────────────────────
const calendarController = require('./controllers/calendar')
// Checks the DB every minute for due calendar reminders
setInterval(() => {
  calendarController.processReminders().catch(err => console.error(err))
}, 60 * 1000)

// Health check — shows API key status without exposing actual keys
app.get('/api/health', (_, res) => {
  const geminiOk    = !!(process.env.GEMINI_API_KEYS && process.env.GEMINI_API_KEYS !== 'your_gemini_api_key_here')
  const grokOk      = !!(process.env.GROK_API_KEYS && process.env.GROK_API_KEYS !== 'your_grok_api_key_here')
  const weatherOk   = !!(process.env.OPENWEATHER_API_KEY && process.env.OPENWEATHER_API_KEY !== 'your_openweathermap_api_key_here')
  res.json({
    status:   'OK',
    app:      'Farmiti v2',
    db:       'MySQL',
    ai:       geminiOk   ? '✅ Gemini AI connected'       : '❌ Add GEMINI_API_KEYS to .env',
    grok:     grokOk     ? '✅ Grok AI configured'         : '❌ Add GROK_API_KEYS to .env',
  })
})

// 404 handler
app.use('*', (_, res) => res.status(404).json({ error: 'Route not found' }))

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
  console.log(`🌱 Farmiti v2 API  →  http://localhost:${PORT}`)
  console.log(`🗄️  DB: MySQL  |  🤖 AI: Gemini  |  🌤️  Weather: OpenWeatherMap`)
  console.log(`\n🔗 Test health:  http://localhost:${PORT}/api/health\n`)
})
