const { query, transaction } = require('../db/connection')
const fs = require('fs')
const path = require('path')

// GET /api/farmer/profile
const getProfile = async (req, res) => {
  try {
    const result = await query(
      `SELECT f.id, f.name, f.phone, f.email, f.state, f.district, f.village,
              f.pincode, f.gender, f.dob, f.avatar_url, f.language_pref, f.weather_sms, f.created_at,
              fd.bank_name, fd.account_no, fd.ifsc, fd.aadhaar, fd.latitude, fd.longitude, fd.soil_report
       FROM farmers f LEFT JOIN farm_details fd ON fd.farmer_id = f.id
       WHERE f.id = ?`,
      [req.farmer.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Profile not found' })
    res.json({ farmer: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
}

// PUT /api/farmer/profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, state, district, village, pincode, gender, dob, language_pref,
            land_size, land_type, soil_type, water_source, primary_crop, bank_name, account_no, ifsc, aadhaar,
            latitude, longitude, soil_report } = req.body

    await transaction(async (client) => {
      await client.query(
        `UPDATE farmers SET name=COALESCE(?,name), email=COALESCE(?,email), state=COALESCE(?,state),
         district=COALESCE(?,district), village=COALESCE(?,village), pincode=COALESCE(?,pincode),
         gender=COALESCE(?,gender), dob=COALESCE(?,dob), language_pref=COALESCE(?,language_pref)
         WHERE id=?`,
        [name||null,email||null,state||null,district||null,village||null,pincode||null,
         gender||null,dob||null,language_pref||null,req.farmer.id]
      )
      const existing = await client.query('SELECT id FROM farm_details WHERE farmer_id=?', [req.farmer.id])
      if (existing.rows.length) {
          await client.query(
            `UPDATE farm_details SET land_size=COALESCE(?,land_size), land_type=COALESCE(?,land_type),
             soil_type=COALESCE(?,soil_type), water_source=COALESCE(?,water_source),
             primary_crop=COALESCE(?,primary_crop), bank_name=COALESCE(?,bank_name),
             account_no=COALESCE(?,account_no), ifsc=COALESCE(?,ifsc), aadhaar=COALESCE(?,aadhaar),
             latitude=COALESCE(?,latitude), longitude=COALESCE(?,longitude), soil_report=COALESCE(?,soil_report)
             WHERE farmer_id=?`,
            [land_size||null,land_type||null,soil_type||null,water_source||null,primary_crop||null,
             bank_name||null,account_no||null,ifsc||null,aadhaar||null,latitude||null,longitude||null,
             soil_report ? JSON.stringify(soil_report) : null, req.farmer.id]
          )
      } else {
        await client.query(
          'INSERT INTO farm_details (farmer_id, land_size, land_type, soil_type, water_source, primary_crop, bank_name, account_no, ifsc, aadhaar, latitude, longitude, soil_report) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [req.farmer.id,land_size||null,land_type||null,soil_type||null,water_source||null,
           primary_crop||null,bank_name||null,account_no||null,ifsc||null,aadhaar||null,
           latitude||null,longitude||null,soil_report ? JSON.stringify(soil_report) : null]
        )
      }
    })
    const updated = await query(
      `SELECT f.*, fd.land_size, fd.land_type, fd.soil_type, fd.water_source, fd.primary_crop,
              fd.bank_name, fd.account_no, fd.ifsc, fd.aadhaar, fd.latitude, fd.longitude, fd.soil_report
       FROM farmers f LEFT JOIN farm_details fd ON fd.farmer_id=f.id WHERE f.id=?`,
      [req.farmer.id]
    )
    res.json({ message: 'Profile updated successfully', farmer: updated.rows[0] })
  } catch (err) {
    console.error('updateProfile error:', err)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

const completeTour = async (req, res) => {
  try {
    // Rely exclusively on frontend localStorage to prevent DB error since column might not exist
    res.json({ message: 'Tour completed' })
  } catch (err) {
    console.error('completeTour error:', err)
    res.status(500).json({ error: 'Failed to mark tour as complete' })
  }
}

// PUT /api/farmer/avatar
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' })

    // Delete old avatar if exists
    const old = await query('SELECT avatar_url FROM farmers WHERE id=?', [req.farmer.id])
    if (old.rows[0]?.avatar_url) {
      const oldPath = path.join(__dirname, '..', old.rows[0].avatar_url)
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`
    await query('UPDATE farmers SET avatar_url=? WHERE id=?', [avatarUrl, req.farmer.id])
    res.json({ message: 'Profile photo updated', avatar_url: avatarUrl })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update photo' })
  }
}

// DELETE /api/farmer/avatar
const deleteAvatar = async (req, res) => {
  try {
    const old = await query('SELECT avatar_url FROM farmers WHERE id=?', [req.farmer.id])
    if (old.rows[0]?.avatar_url) {
      const oldPath = path.join(__dirname, '..', old.rows[0].avatar_url)
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
    }
    await query('UPDATE farmers SET avatar_url=NULL WHERE id=?', [req.farmer.id])
    res.json({ message: 'Profile photo removed' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete photo' })
  }
}

// GET /api/farmer/crops
const getCrops = async (req, res) => {
  try {
    const result = await query('SELECT * FROM farmer_crops WHERE farmer_id=? ORDER BY created_at DESC', [req.farmer.id])
    res.json({ crops: result.rows })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crops' })
  }
}

// POST /api/farmer/crops
const addCrop = async (req, res) => {
  try {
    const { crop_name, acres, season, status, planted_at, expected_harvest, notes } = req.body
    if (!crop_name) return res.status(400).json({ error: 'Crop name is required' })
    const imgMap = {
      'Rice':'https://images.unsplash.com/photo-1536304993881-ff86e0c9ef82?w=200&q=70',
      'Wheat':'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&q=70',
      'Tomato':'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=200&q=70',
      'Onion':'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=200&q=70',
      'Cotton':'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=70',
      'Maize':'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=200&q=70',
    }
    const img_url = imgMap[crop_name] || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=200&q=70'
    const ins = await query(
      'INSERT INTO farmer_crops (farmer_id, crop_name, acres, season, status, planted_at, expected_harvest, notes, img_url) VALUES (?,?,?,?,?,?,?,?,?)',
      [req.farmer.id, crop_name, acres||null, season||null, status||'Growing', planted_at||null, expected_harvest||null, notes||null, img_url]
    )
    const crop = await query('SELECT * FROM farmer_crops WHERE id=?', [ins.insertId])
    res.status(201).json({ message: 'Crop added', crop: crop.rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'Failed to add crop' })
  }
}

// PUT /api/farmer/crops/:id
const updateCrop = async (req, res) => {
  try {
    const { crop_name, acres, season, status, planted_at, expected_harvest, notes } = req.body
    const upd = await query(
      `UPDATE farmer_crops SET crop_name=COALESCE(?,crop_name), acres=COALESCE(?,acres),
       season=COALESCE(?,season), status=COALESCE(?,status), planted_at=COALESCE(?,planted_at),
       expected_harvest=COALESCE(?,expected_harvest), notes=COALESCE(?,notes)
       WHERE id=? AND farmer_id=?`,
      [crop_name||null,acres||null,season||null,status||null,planted_at||null,expected_harvest||null,notes||null,req.params.id,req.farmer.id]
    )
    if (!upd.affectedRows) return res.status(404).json({ error: 'Crop not found' })
    const crop = await query('SELECT * FROM farmer_crops WHERE id=?', [req.params.id])
    res.json({ message: 'Crop updated', crop: crop.rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update crop' })
  }
}

// DELETE /api/farmer/crops/:id
const deleteCrop = async (req, res) => {
  try {
    const result = await query('DELETE FROM farmer_crops WHERE id=? AND farmer_id=?', [req.params.id, req.farmer.id])
    if (!result.affectedRows) return res.status(404).json({ error: 'Crop not found' })
    res.json({ message: 'Crop removed' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete crop' })
  }
}

// DELETE /api/farmer/account
const deleteAccount = async (req, res) => {
  try {
    // All child tables use ON DELETE CASCADE, so this single DELETE wipes everything
    const result = await query('DELETE FROM farmers WHERE id = ?', [req.farmer.id])
    if (!result.affectedRows) return res.status(404).json({ error: 'Account not found' })
    res.json({ message: 'Account permanently deleted. All your data has been removed.' })
  } catch (err) {
    console.error('deleteAccount error:', err)
    res.status(500).json({ error: 'Failed to delete account. Please try again.' })
  }
}

module.exports = { getProfile, updateProfile, completeTour, updateAvatar, deleteAvatar, getCrops, addCrop, updateCrop, deleteCrop, deleteAccount }
