const fetch = require('node-fetch')
const { query } = require('../db/connection')

const getMockWeather = (city) => ({
  location: city ? city.replace(',IN', '') : 'Thanjavur, Tamil Nadu',
  temp: 33, feels_like: 37, humidity: 72, wind_speed: 12,
  visibility: 8, pressure: 1013, description: 'Partly Cloudy', uv_index: 7,
  forecast: [
    { day: 'Today', high: 34, low: 26, description: 'Partly Cloudy', rain_chance: 15, icon: 'cloud-sun' },
    { day: 'Tue',   high: 31, low: 24, description: 'Heavy Rain',    rain_chance: 75, icon: 'cloud-rain' },
    { day: 'Wed',   high: 28, low: 22, description: 'Thunderstorm',  rain_chance: 90, icon: 'thunderstorm' },
    { day: 'Thu',   high: 30, low: 23, description: 'Moderate Rain', rain_chance: 60, icon: 'cloud-rain' },
    { day: 'Fri',   high: 33, low: 25, description: 'Cloudy',        rain_chance: 20, icon: 'cloud' },
    { day: 'Sat',   high: 36, low: 27, description: 'Sunny',         rain_chance: 5,  icon: 'sun' },
    { day: 'Sun',   high: 35, low: 26, description: 'Clear',         rain_chance: 10, icon: 'sun' },
  ],
  hourly: [
    { time: '6am',  temp: 27, rain: 5  },
    { time: '9am',  temp: 30, rain: 10 },
    { time: '12pm', temp: 34, rain: 15 },
    { time: '3pm',  temp: 35, rain: 20 },
    { time: '6pm',  temp: 32, rain: 30 },
    { time: '9pm',  temp: 29, rain: 40 },
    { time: '12am', temp: 27, rain: 55 },
  ],
  alerts: [
    {
      id: 's1', type: 'warning', severity: 'Medium',
      title: '⛈️ Thunderstorm Expected',
      description: 'Heavy thunderstorms likely Wednesday. Secure equipment.',
      area: 'Your Region',
      actions: ['Secure farm equipment', 'Avoid open fields', 'Protect crops with covers'],
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
      id: 's2', type: 'info', severity: 'Low',
      title: '☀️ Heat Advisory',
      description: 'Temperatures rising this weekend. Apply mulch to retain moisture.',
      area: 'Interior Region',
      actions: ['Increase irrigation', 'Apply mulch', 'Harvest in morning hours'],
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
  ],
  source: 'mock',
})

// Build weather icon from description
const getIcon = (desc) => {
  const d = (desc || '').toLowerCase()
  if (d.includes('thunder')) return 'thunderstorm'
  if (d.includes('rain') || d.includes('drizzle')) return 'cloud-rain'
  if (d.includes('cloud')) return 'cloud'
  if (d.includes('snow')) return 'snow'
  return 'sun'
}

// Validate OpenWeather API key
const isValidKey = (key) =>
  key && key.trim() !== '' && key !== 'your_openweathermap_api_key_here'

// Save weather alert to DB
const saveWeatherAlert = async (farmerId, alertData) => {
  try {
    await query(
      `INSERT INTO weather_alerts (farmer_id, type, title, description, severity, area, actions, expires_at)
       VALUES (?,?,?,?,?,?,?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
      [
        farmerId,
        alertData.type,
        alertData.title,
        alertData.description,
        alertData.severity,
        alertData.area,
        JSON.stringify(alertData.actions || []),
      ]
    )
  } catch (err) {
    console.error('saveWeatherAlert error:', err.message)
  }
}

// GET /api/weather/current
const getCurrentWeather = async (req, res) => {
  try {
    const { lat, lon, city } = req.query
    const apiKey = (process.env.OPENWEATHER_API_KEY || '').trim()

    if (!isValidKey(apiKey)) {
      console.warn('⚠️  OPENWEATHER_API_KEY not set — returning mock weather data')
      return res.json({
        ...getMockWeather(city),
        weather_sms: !!req.farmer.weather_sms,
        note: 'Add OPENWEATHER_API_KEY to .env for live weather data',
      })
    }

    const base = 'https://api.openweathermap.org/data/2.5'
    let wUrl, fUrl

    if (lat && lon) {
      wUrl = `${base}/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${apiKey}&units=metric`
      fUrl = `${base}/forecast?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${apiKey}&units=metric`
    } else {
      const q = encodeURIComponent(city || 'Thanjavur,IN')
      wUrl = `${base}/weather?q=${q}&appid=${apiKey}&units=metric`
      fUrl = `${base}/forecast?q=${q}&appid=${apiKey}&units=metric`
    }

    console.log('🌤️  Fetching weather from OpenWeatherMap...')
    const [wRes, fRes] = await Promise.all([fetch(wUrl), fetch(fUrl)])
    const [wData, fData] = await Promise.all([wRes.json(), fRes.json()])

    // Handle API errors
    if (wData.cod === 401 || wData.cod === '401') {
      console.error('❌ Invalid OpenWeather API key')
      return res.json({
        ...getMockWeather(city),
        weather_sms: !!req.farmer.weather_sms,
        error: 'Invalid API key. Please check your OPENWEATHER_API_KEY in .env',
        source: 'mock_fallback',
      })
    }

    if (wData.cod === 404 || wData.cod === '404') {
      // City not found -> fallback quietly
      return res.json({
        ...getMockWeather(city),
        weather_sms: !!req.farmer.weather_sms,
        source: 'mock_fallback',
        note: `City '${city}' not found online, using offline data directly.`
      })
    }

    if (wData.cod !== 200 && wData.cod !== '200') {
      console.error('❌ OpenWeather API error:', wData.message)
      return res.json(getMockWeather(city))
    }

    // Build 7-day forecast from 3-hour slots
    const dailyMap = {}
    for (const item of (fData.list || [])) {
      const date = item.dt_txt.split(' ')[0]
      if (!dailyMap[date]) {
        dailyMap[date] = { temps: [], rain: 0, desc: item.weather[0].description }
      }
      dailyMap[date].temps.push(item.main.temp)
      dailyMap[date].rain = Math.max(dailyMap[date].rain, (item.pop || 0) * 100)
    }

    const forecast = Object.entries(dailyMap).slice(0, 7).map(([dateStr, d], i) => ({
      day: i === 0 ? 'Today' : new Date(dateStr + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' }),
      high: Math.round(Math.max(...d.temps)),
      low:  Math.round(Math.min(...d.temps)),
      description: d.desc,
      rain_chance: Math.round(d.rain),
      icon: getIcon(d.desc),
    }))

    // Hourly from next 7 slots
    const hourly = (fData.list || []).slice(0, 7).map(item => ({
      time: new Date(item.dt * 1000).toLocaleTimeString('en', { hour: 'numeric', hour12: true }),
      temp: Math.round(item.main.temp),
      rain: Math.round((item.pop || 0) * 100),
    }))

    // Generate farm alerts based on real weather and save them to DB
    const T = {
      en: { 
        h_title: '🌊 Heavy Rain Warning', h_desc: 'Heavy rainfall expected. Harvest mature crops and open drainage channels.',
        t_title: '🌡️ Heat Stress Alert', t_desc: 'Temperature {t}°C. Apply mulch and increase irrigation.',
        w_title: '💨 High Wind Advisory', w_desc: 'Wind speed {s} km/h. Secure tall crops and structures.'
      },
      hi: { 
        h_title: '🌊 भारी बारिश की चेतावनी', h_desc: 'भारी बारिश की संभावना। पकी हुई फसलों की कटाई करें और जल निकासी चैनल खोलें।',
        t_title: '🌡️ हीट स्ट्रेस अलर्ट', t_desc: 'तापमान {t}°C। मल्च लगाएं और सिंचाई बढ़ाएं।',
        w_title: '💨 तेज हवा की सलाह', w_desc: 'हवा की गति {s} किमी/घंटा। लंबी फसलों और संरचनाओं को सुरक्षित करें।'
      },
      // ... Add others as needed or fallback to EN
    }
    const lang = req.farmer?.language_pref || 'en'
    const t = T[lang] || T.en
    const alerts = []
    const farmerId = req.farmer?.id

    if (forecast[0]?.rain_chance > 70) {
      const alert = {
        id: 'w1', type: 'danger', severity: 'High',
        title: t.h_title,
        description: t.h_desc,
        area: wData.name || 'Your Location',
        actions: ['Harvest mature crops now', 'Open drainage channels', 'Move equipment to shelter'],
        created_at: new Date().toISOString(),
      }
      alerts.push(alert)
      if (farmerId) {
        // Anti-spam check: See if same alert was sent in last 12h
        const recent = await query(
          "SELECT id FROM notifications WHERE farmer_id=? AND title=? AND created_at > DATE_SUB(NOW(), INTERVAL 12 HOUR)",
          [farmerId, alert.title]
        )
        if (!recent.rows.length) {
          await saveWeatherAlert(farmerId, alert)
          await query(
            'INSERT INTO notifications (farmer_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
            [farmerId, 'weather', alert.title, alert.description, '/weather']
          )
        }
      }
    }

    if (wData.main.temp > 38) {
      const alert = {
        id: 'w2', type: 'warning', severity: 'Medium',
        title: t.t_title,
        description: t.t_desc.replace('{t}', Math.round(wData.main.temp)),
        area: wData.name || 'Your Location',
        actions: ['Apply mulch 5-10cm', 'Irrigate in morning', 'Provide shade for seedlings'],
        created_at: new Date().toISOString(),
      }
      alerts.push(alert)
      if (farmerId) {
        const recent = await query(
          "SELECT id FROM notifications WHERE farmer_id=? AND title=? AND created_at > DATE_SUB(NOW(), INTERVAL 12 HOUR)",
          [farmerId, alert.title]
        )
        if (!recent.rows.length) {
          await saveWeatherAlert(farmerId, alert)
          await query(
            'INSERT INTO notifications (farmer_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
            [farmerId, 'weather', alert.title, alert.description, '/weather']
          )
        }
      }
    }

    if (wData.wind.speed > 10) {
      const alert = {
        id: 'w3', type: 'info', severity: 'Low',
        title: t.w_title,
        description: t.w_desc.replace('{s}', Math.round(wData.wind.speed * 3.6)),
        area: wData.name || 'Your Location',
        actions: ['Stake tall crops', 'Secure greenhouse covers', 'Postpone spraying'],
        created_at: new Date().toISOString(),
      }
      alerts.push(alert)
    }

    console.log(`✅ Weather fetched for ${wData.name} — ${Math.round(wData.main.temp)}°C`)

    res.json({
      location:     `${wData.name}, ${wData.sys.country}`,
      temp:         Math.round(wData.main.temp),
      feels_like:   Math.round(wData.main.feels_like),
      humidity:     wData.main.humidity,
      wind_speed:   Math.round(wData.wind.speed * 3.6),
      visibility:   Math.round((wData.visibility || 8000) / 1000),
      pressure:     wData.main.pressure,
      description:  wData.weather[0].description,
      uv_index:     null,
      forecast,
      hourly,
      alerts,
      weather_sms:  !!req.farmer.weather_sms,
      source:       'openweathermap',
      fetched_at:   new Date().toISOString(),
    })
  } catch (err) {
    console.error('❌ Weather fetch error:', err.message)
    // Return mock data as fallback — never crash the frontend
    res.json({
      ...getMockWeather(req.query.city),
      weather_sms: !!req.farmer.weather_sms,
      error: 'Weather service temporarily unavailable',
      source: 'mock_fallback',
    })
  }
}

// GET /api/weather/alerts
const getAlerts = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM weather_alerts WHERE farmer_id=? ORDER BY created_at DESC LIMIT 20',
      [req.farmer.id]
    )
    res.json({ alerts: result.rows })
  } catch (err) {
    console.error('getAlerts error:', err)
    res.status(500).json({ error: 'Failed to fetch alerts' })
  }
}

// POST /api/weather/subscribe
const subscribeAlerts = async (req, res) => {
  try {
    const { enabled } = req.body
    await query('UPDATE farmers SET weather_sms=?, updated_at=NOW() WHERE id=?', [enabled ? 1 : 0, req.farmer.id])
    
    if (enabled) {
      await query(
        'INSERT INTO notifications (farmer_id, type, title, message, link) VALUES (?,?,?,?,?)',
        [req.farmer.id, 'weather_subscribe', '🌤️ Weather Alerts Active', 'You will now receive live weather alerts in your dashboard.', '/weather']
      )
    }
    
    res.json({ message: enabled ? 'Subscribed to alerts' : 'Unsubscribed from alerts', weather_sms: !!enabled })
  } catch (err) {
    console.error('subscribeAlerts error:', err)
    res.status(500).json({ error: 'Failed to update subscription' })
  }
}

module.exports = { getCurrentWeather, getAlerts, subscribeAlerts }
