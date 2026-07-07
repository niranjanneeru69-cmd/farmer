require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const morgan = require('morgan')
const { pool } = require('./db/connection')

// ── Startup diagnostics ────────────────────────────────────────────────────
const checkEnv = () => {
  const checks = {
    'DB_HOST': process.env.DB_HOST,
    'DB_PORT': process.env.DB_PORT,
    'DB_NAME': process.env.DB_NAME,
    'DB_USER': process.env.DB_USER,
    'DB_PASSWORD': process.env.DB_PASSWORD,
    'EMAIL_USER': process.env.EMAIL_USER,
    'EMAIL_PASS': process.env.EMAIL_PASS,
    'GEMINI_API_KEYS': process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY,
    'JWT_SECRET': process.env.JWT_SECRET,
    'OPENWEATHER_API_KEY': process.env.OPENWEATHER_API_KEY,
    'FRONTEND_URL': process.env.FRONTEND_URL,
    'CLIENT_URL': process.env.CLIENT_URL,
    'BACKEND_URL': process.env.BACKEND_URL,
  }
  console.log('\n📋 Environment Check:')
  Object.entries(checks).forEach(([k, val]) => {
    const isConfigured = val && val !== 'your_gemini_api_key_here' && val !== 'your_grok_api_key_here' && val !== 'your_openweathermap_api_key_here' && val !== 'farmiti_super_secret_key_change_this_2025'
    console.log(`   ${isConfigured ? '✅' : '❌'} ${k}${isConfigured ? '' : ' — NOT configured (check .env)'}`)
  })
  console.log('')
}
checkEnv()
// ──────────────────────────────────────────────────────────────────────────

const app = express()

// Trust reverse proxy for correct client IP detection, secure cookies, and rate limiting
app.set("trust proxy", 1)

// Morgan logging based on environment
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Security Headers (configured to allow cross-origin requests for uploads)
app.use(helmet({
  crossOriginResourcePolicy: false,
}))

// Rate Limiting (DDoS prevention)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
})
app.use('/api/', apiLimiter)

// Response compression for better performance
app.use(compression())

// CORS — allow frontend origin
const allowedOrigins = [
  "http://localhost:5173",
  "https://farmiti-frontend.onrender.com",
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL
].filter(Boolean)

// app.use(cors({
//   origin(origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true)
//     } else {
//       callback(new Error(`CORS: Origin ${origin} not allowed`))
//     }
//   },
//   credentials: true
// }))
app.use(cors({ origin: true, credentials: true }));

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Simple, dependency-free HTML/script sanitization to prevent XSS injection
const sanitizeInput = (val) => {
  if (typeof val === 'string') {
    return val.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '').trim()
  }
  if (typeof val === 'object' && val !== null) {
    for (const key in val) {
      val[key] = sanitizeInput(val[key])
    }
  }
  return val
}
app.use((req, res, next) => {
  if (req.body) req.body = sanitizeInput(req.body)
  if (req.query) req.query = sanitizeInput(req.query)
  next()
})

// Serve uploaded images with static asset caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true,
}))

// ── Lightweight Health Check Endpoint (Render monitoring) ─────────────────
app.get('/health', (_, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'FARMNITI Backend is running'
  })
})

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'))
app.use('/api/farmer', require('./routes/farmer'))
app.use('/api/weather', require('./routes/weather'))
app.use('/api/market', require('./routes/market'))
app.use('/api/crops', require('./routes/crops'))
app.use('/api/disease', require('./routes/disease'))
app.use('/api/schemes', require('./routes/schemes'))
app.use('/api/chat', require('./routes/chat'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/history', require('./routes/history'))
app.use('/api/calendar', require('./routes/calendar'))

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
const cronInterval = setInterval(() => {
  calendarController.processReminders().catch(err => console.error(err))
}, 60 * 1000)

// Detailed Diagnostic Health Check
app.get('/api/health', (_, res) => {
  const geminiOk = !!(process.env.GEMINI_API_KEYS && process.env.GEMINI_API_KEYS !== 'your_gemini_api_key_here')
  const grokOk = !!(process.env.GROK_API_KEYS && process.env.GROK_API_KEYS !== 'your_grok_api_key_here')
  res.json({
    status: 'OK',
    app: 'Farmiti v2',
    db: 'MySQL',
    ai: geminiOk ? '✅ Gemini AI connected' : '❌ Add GEMINI_API_KEYS to .env',
    grok: grokOk ? '✅ Grok AI configured' : '❌ Add GROK_API_KEYS to .env',
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
const server = app.listen(PORT, () => {
  console.log(`🌱 Farmiti v2 API  →  http://localhost:${PORT}`)
  console.log(`🗄️  DB: MySQL  |  🤖 AI: Gemini  |  🌤️  Weather: OpenWeatherMap`)
  console.log(`\n🔗 Test health:  http://localhost:${PORT}/health\n`)
})

// Graceful Shutdown Handling (prevents data corruption and handles redeployments cleanly)
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown of FARMNITI backend...`)

  clearInterval(cronInterval)

  server.close(async () => {
    console.log('✔ Express HTTP server closed. No longer accepting new requests.')
    try {
      await pool.end()
      console.log('✔ Database connection pool drained and closed successfully.')
      console.log('👋 Clean shutdown completed.')
      process.exit(0)
    } catch (err) {
      console.error('❌ Error closing database pool during shutdown:', err.message)
      process.exit(1)
    }
  })

  // Timeout fallback
  setTimeout(() => {
    console.error('⚠️ Force shutdown initiated. Connections hung.')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
