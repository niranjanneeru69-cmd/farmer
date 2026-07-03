const { query } = require('../db/connection')
const nodemailer = require('nodemailer')
const fetch = require('node-fetch')

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// node-cron is initialized in server.js but the checks rely on this DB setup.
// We manage typical CRUD here and secure by req.user.id

exports.getEvents = async (req, res) => {
  if (!req.farmer) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const events = await query(`
      SELECT * FROM calendar_events 
      WHERE farmer_id = ?
      ORDER BY event_date ASC, start_time ASC
    `, [req.farmer.id])

    const rows = events.rows || events

    const formatted = rows.map(e => {
      if (!e.event_date) return null;
      
      const d = new Date(e.event_date);
      if (isNaN(d.getTime())) return null;
      
      // Use local date parts to avoid UTC timezone shifts with toISOString()
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      return {
        id: e.id,
        title: e.title,
        start: e.start_time ? `${dateStr}T${e.start_time}` : dateStr,
        end: e.end_time ? `${dateStr}T${e.end_time}` : null,
        extendedProps: {
          description: e.description,
          type: e.type,
          status: e.status,
          reminder_mins: e.reminder_mins,
          is_favorite: !!e.is_favorite
        }
      }
    }).filter(Boolean)

    res.json({ events: formatted })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch calendar events' })
  }
}

exports.addEvent = async (req, res) => {
  if (!req.farmer) return res.status(401).json({ error: 'Unauthorized' })
  const { title, event_date, start_time, end_time, description, type, reminder_mins } = req.body
  try {
    const result = await query(`
      INSERT INTO calendar_events (farmer_id, title, event_date, start_time, end_time, description, type, reminder_mins)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.farmer.id, title, event_date, start_time || null, end_time || null, description || null, type || 'task', reminder_mins || 10])

    res.status(201).json({ message: 'Event created', id: result.insertId || (result.rows && result.rows[0]?.id) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create event' })
  }
}

exports.updateEvent = async (req, res) => {
  if (!req.farmer) return res.status(401).json({ error: 'Unauthorized' })
  const { title, event_date, start_time, end_time, description, type, status, reminder_mins } = req.body

  try {
    const existing = await query(
      'SELECT id FROM calendar_events WHERE id = ? AND farmer_id = ?',
      [req.params.id, req.farmer.id]
    )

    const rows = existing.rows || existing
    if (rows.length === 0) return res.status(403).json({ error: 'Unauthorized or event not found' })

    await query(`
      UPDATE calendar_events 
      SET title = ?, event_date = ?, start_time = ?, end_time = ?, description = ?, type = ?, status = ?, reminder_mins = ?, notified = FALSE
      WHERE id = ? AND farmer_id = ?
    `, [title, event_date, start_time || null, end_time || null, description || null, type || 'task', status || 'upcoming', reminder_mins || 10, req.params.id, req.farmer.id])

    res.json({ message: 'Event updated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update event' })
  }
}

exports.deleteEvent = async (req, res) => {
  if (!req.farmer) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const result = await query('DELETE FROM calendar_events WHERE id = ? AND farmer_id = ?', [req.params.id, req.farmer.id])
    if ((result.affectedRows || 0) === 0) return res.status(403).json({ error: 'Unauthorized or event not found' })
      
    res.json({ message: 'Event deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete event' })
  }
}

// Global Notification Cron Logic exported to run in server.js
// Enhanced with precise Node-side time comparison to handle TZ offsets
exports.processReminders = async () => {
  try {
    // Fetch events starting in the next 15 minutes that haven't been notified
    const dueEvents = await query(`
      SELECT e.*, f.language_pref, f.email, f.district, f.state 
      FROM calendar_events e 
      JOIN farmers f ON e.farmer_id = f.id
      WHERE e.notified = FALSE
      AND e.start_time IS NOT NULL 
      AND e.event_date >= CURDATE()
    `)

    const rows = dueEvents.rows || dueEvents
    const now = new Date()

    const T = {
      en: { u: 'Upcoming', r: 'Your event starts in {m} minutes.' },
      hi: { u: 'आगामी', r: 'आपका कार्यक्रम {m} मिनट में शुरू होगा।' },
      te: { u: 'రాబోయే', r: 'మీ ఈవెంట్ {m} నిమిషాల్లో ప్రారంభమవుతుంది.' },
      ta: { u: 'வரவிருக்கும்', r: 'உங்கள் நிகழ்வு {m} நிமிடங்களில் தொடங்கும்.' },
      kn: { u: 'ಮುಂಬರುವ', r: 'ನಿಮ್ಮ ಈವೆಂಟ್ {m} ನಿಮಿಷಗಳಲ್ಲಿ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ.' },
      ml: { u: 'വരാനിരിക്കുന്ന', r: 'നിങ്ങളുടെ ഇവന്റ് {m} മിനിറ്റിനുള്ളിൽ ആരംഭിക്കും.' },
      mr: { u: 'आगामी', r: 'तुमचा कार्यक्रम {m} मिनिटांत सुरू होईल.' },
      pa: { u: 'ਆਗਾਮੀ', r: 'ਤੁਹਾਡਾ ਇਵੈਂਟ {m} ਮਿੰਟਾਂ ਵਿੱਚ ਸ਼ੁਰੂ ਹੋਵੇਗਾ।' },
      bn: { u: 'আসন্ন', r: 'আপনার ইভেন্ট {m} মিনিটের মধ্যে শুরু হবে।' },
      gu: { u: 'આગામી', r: 'તમારી ઇવેન્ટ {m} મિનિટમાં શરૂ થશે.' },
      or: { u: 'ଆଗାମୀ', r: 'ଆପଣଙ୍କର ଇଭେଣ୍ଟ {m} ମିନିଟରେ ଆରମ୍ଭ ହେବ |' },
      ur: { u: 'آنے والی', r: 'آپ کا ایونٹ {m} منٹ میں شروع ہو جائے گا۔' }
    }

    for (const row of rows) {
      const [h, m, s] = row.start_time.split(':')
      const eventTime = new Date(row.event_date)
      eventTime.setHours(parseInt(h), parseInt(m), parseInt(s || 0))

      const diffMs = eventTime - now
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins >= -15 && diffMins <= row.reminder_mins) {
        console.log(`[Calendar] Sending reminder to ${row.email} for event "${row.title}" (diff: ${diffMins}m)`)
        const lang = row.language_pref || 'en'
        const t = T[lang] || T.en
        const title = `${t.u}: ${row.title}`
        const msg = `${t.r.replace('{m}', diffMins)}${row.description ? `\n\nNote: ${row.description}` : ''}`

        await query(`
          INSERT INTO notifications (farmer_id, type, title, message, link)
          VALUES (?, 'calendar', ?, ?, '/calendar')
        `, [row.farmer_id, title, msg])

        if (row.email) {
          try {
            let weatherAlertStr = 'No critical weather alerts right now.'
            const apiKey = (process.env.OPENWEATHER_API_KEY || '').trim()
            if (apiKey) {
              const q = encodeURIComponent(row.district || row.state || 'Chennai,IN')
              const wRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${apiKey}&units=metric`).catch(()=>null)
              if (wRes && wRes.ok) {
                const wData = await wRes.json()
                weatherAlertStr = `Current weather in ${wData.name || 'your area'}: ${Math.round(wData.main.temp)}°C, ${wData.weather[0]?.description}.`
                if (wData.main.temp > 38) weatherAlertStr += ' 🌡️ HEAT ALERT: High temperatures today.'
                if (wData.wind?.speed > 10) weatherAlertStr += ' 💨 WIND ALERT: High winds expected.'
                if (wData.weather[0]?.main === 'Rain') weatherAlertStr += ' 🌧️ RAIN ALERT: Rainfall detected.'
              }
            }

            const mailOptions = {
              from: `"Farmiti Calendar" <${process.env.EMAIL_USER}>`,
              to: row.email,
              subject: `📅 Reminder: ${row.title}`,
              html: `
                <div style="background-color: #f7faf8; padding: 40px 20px; font-family: 'Helvetica Neue', Arial, sans-serif;">
                  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                    <div style="background: linear-gradient(135deg, #1A5C38 0%, #298251 100%); padding: 30px 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Farmiti Reminder</h1>
                      <p style="color: #a7f3d0; margin: 8px 0 0 0; font-size: 14px;">Your farming schedule, streamlined.</p>
                    </div>
                    
                    <div style="padding: 40px;">
                      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">📝 ${row.title}</h2>
                      
                      <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                        <p style="margin: 0 0 10px 0; color: #166534; font-size: 15px;">
                          <strong style="color: #14532d;">🕒 Time:</strong> ${row.start_time}
                        </p>
                        <p style="margin: 0; color: #166534; font-size: 15px; line-height: 1.5;">
                          <strong style="color: #14532d;">📋 Details:</strong><br/>
                          ${row.description || '<i>No additional description provided.</i>'}
                        </p>
                      </div>

                      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px;">
                        <h3 style="margin: 0 0 8px 0; color: #b45309; font-size: 16px;">🌦️ Local Weather Update</h3>
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">${weatherAlertStr}</p>
                      </div>
                      
                      <div style="margin-top: 35px; text-align: center;">
                        <a href="http://localhost:5173/calendar" style="background-color: #1A5C38; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 4px 6px rgba(26,92,56,0.2);">Open in Farmiti</a>
                      </div>
                    </div>
                    
                    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2026 Farmiti Agritech.<br/>You are receiving this because you set a calendar alert.</p>
                    </div>
                  </div>
                </div>
              `
            }
            transporter.sendMail(mailOptions).catch(err => console.error('Failed to send calendar email:', err.message))
          } catch (e) {
            console.error('Weather/Email error:', e.message)
          }
        }

        await query(`UPDATE calendar_events SET notified = TRUE WHERE id = ?`, [row.id])
      } else if (diffMins < -15) {
        // Mark as notified if already passed without notification
        await query(`UPDATE calendar_events SET notified = TRUE WHERE id = ?`, [row.id])
      }
    }
  } catch (err) {
    console.error('Calendar Cron Error:', err.message)
  }
}