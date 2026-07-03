const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const axios = require('axios')
const { query, transaction } = require('../db/connection')
const { saveOTP, verifyOTP } = require('../utils/otpStore')

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, phone, password, email, otp, state, district, village, city, pincode,
            land_size, land_type, soil_type, water_source, primary_crop, language_pref } = req.body

    if (!name || !phone || !password || !email || !otp) {
      return res.status(400).json({ error: 'Name, phone, password, email, and OTP are required' })
    }

    // Verify OTP
    const isOtpValid = verifyOTP(email, otp)
    if (!isOtpValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please try again.' })
    }
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

    const existing = await query('SELECT id FROM farmers WHERE phone = ?', [phone])
    if (existing.rows.length) return res.status(409).json({ error: 'Phone number already registered' })

    const password_hash = await bcrypt.hash(password, 12)

    // Geocoding: Get Lat/Lon from City or Pincode
    let latitude = null, longitude = null
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY
      if (apiKey) {
        // Try Pincode first
        let geoUrl = `http://api.openweathermap.org/geo/1.0/zip?zip=${pincode},IN&appid=${apiKey}`
        let geoRes = await axios.get(geoUrl).catch(() => null)
        
        if (!geoRes || !geoRes.data || !geoRes.data.lat) {
          // Fallback to City
          geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${city || village},${state},IN&limit=1&appid=${apiKey}`
          geoRes = await axios.get(geoUrl).catch(() => null)
          if (geoRes?.data?.[0]) {
            latitude = geoRes.data[0].lat
            longitude = geoRes.data[0].lon
          }
        } else {
          latitude = geoRes.data.lat
          longitude = geoRes.data.lng || geoRes.data.lon
        }
      }
    } catch (e) {
      console.error('Geocoding error during register:', e.message)
    }

    const farmer = await transaction(async (client) => {
      const res1 = await client.query(
        'INSERT INTO farmers (name, phone, email, password_hash, state, district, village, pincode, language_pref) VALUES (?,?,?,?,?,?,?,?,?)',
        [name, phone, email||null, password_hash, state||'Tamil Nadu', district||null, village||city||null, pincode||null, language_pref||'en']
      )
      const farmerId = res1.insertId

      await client.query(
        'INSERT INTO farm_details (farmer_id, land_size, land_type, soil_type, water_source, primary_crop, latitude, longitude) VALUES (?,?,?,?,?,?,?,?)',
        [farmerId, land_size||null, land_type||null, soil_type||null, water_source||null, primary_crop||null, latitude, longitude]
      )

      // Welcome notification
      await client.query(
        'INSERT INTO notifications (farmer_id, type, title, message) VALUES (?,?,?,?)',
        [farmerId, 'welcome', '🌱 Welcome to Farmiti!', 'Your account is set up. Explore weather alerts, market prices, and AI crop recommendations.']
      )

      const fetched = await client.query(
        'SELECT id, name, phone, email, state, district, avatar_url, language_pref, weather_sms FROM farmers WHERE id = ?',
        [farmerId]
      )
      return fetched.rows[0]
    })

    const token = generateToken(farmer.id)
    res.status(201).json({ message: 'Registration successful! Welcome to Farmiti.', token, farmer })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Registration failed. Please try again.' })
  }
}

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required' })

    const result = await query(
      `SELECT f.id, f.name, f.phone, f.email, f.password_hash, f.state, f.district, f.village, f.pincode, f.avatar_url, f.language_pref, f.weather_sms,
              fd.land_size, fd.land_type, fd.soil_type, fd.water_source, fd.primary_crop, fd.latitude, fd.longitude, fd.soil_report
       FROM farmers f LEFT JOIN farm_details fd ON fd.farmer_id = f.id
       WHERE f.phone = ? AND f.is_active = TRUE`,
      [phone]
    )
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid phone number or password' })

    const farmer = result.rows[0]
    const isMatch = await bcrypt.compare(password, farmer.password_hash)
    if (!isMatch) return res.status(401).json({ error: 'Invalid phone number or password' })

    const { password_hash, ...farmerData } = farmer
    const token = generateToken(farmer.id)
    res.json({ message: `Welcome back, ${farmer.name}!`, token, farmer: farmerData })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed. Please try again.' })
  }
}

// GET /api/auth/me
const me = async (req, res) => {
  try {
    const result = await query(
      `SELECT f.id, f.name, f.phone, f.email, f.state, f.district, f.village,
              f.pincode, f.gender, f.dob, f.avatar_url, f.language_pref, f.weather_sms, f.created_at,
              fd.land_size, fd.land_type, fd.soil_type, fd.water_source, fd.primary_crop,
              fd.latitude, fd.longitude, fd.soil_report
       FROM farmers f LEFT JOIN farm_details fd ON fd.farmer_id = f.id
       WHERE f.id = ?`,
      [req.farmer.id]
    )
    res.json({ farmer: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
}

// POST /api/auth/send-otp
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    saveOTP(email, otp)

    const mailOptions = {
      from: `"Farmiti Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🌱 Farmiti - Your Verification Code',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background-color: #f9fafb; border-radius: 12px; max-width: 500px; margin: auto; border: 1px solid #e5e7eb;">
          <h2 style="color: #059669; text-align: center;">Welcome to Farmiti!</h2>
          <p style="color: #374151; font-size: 16px;">Hello there,</p>
          <p style="color: #374151; font-size: 16px;">To complete your registration, please use the verification code below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: 800; color: #059669; letter-spacing: 5px; padding: 15px 30px; background: #ecfdf5; border-radius: 8px; border: 2px dashed #10b981;">
              ${otp}
            </span>
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center;">This code will expire in 5 minutes.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
    res.json({ message: 'OTP sent successfully to your email' })
  } catch (err) {
    console.error('Send OTP error:', err)
    res.status(500).json({ error: 'Failed to send OTP. Please check your email and try again.' })
  }
}

module.exports = { register, login, me, sendOTP }
