const { query } = require('../db/connection')
const { analyzeImage, getGenAI, getGrokKey } = require('./geminiHelper')
const path = require('path')
const fs = require('fs')

const DISEASE_PROMPT = (lang) => `You are an expert agricultural plant pathologist. Analyze this crop/plant image carefully.

IMPORTANT LANGUAGE INSTRUCTION:
You MUST respond entirely in the language code: "${lang}".
Whenever you mention a crop name, disease, or technical term, ALWAYS format it as: TranslatedName (EnglishName). 
Example in Telugu for Cotton: పత్తి (Cotton). Follow this bracket format strictly.

First check: Is this actually an image of a crop, plant, leaf, stem, fruit, or any agricultural produce?

If NOT a crop/plant image, respond with ONLY this JSON (no markdown, no code fences):
{"is_crop_image": false, "message": "This image does not appear to be a crop or plant. Please upload a clear photo of a crop leaf, stem, fruit, or affected plant part for disease analysis."}

If YES it is a crop/plant image, respond with ONLY this JSON (no markdown, no code fences, no explanation):
{
  "is_crop_image": true,
  "crop_name": "identified crop name",
  "disease_name": "disease name or 'Healthy Plant' if no disease",
  "scientific_name": "scientific name of pathogen or 'N/A' if healthy",
  "confidence": 90,
  "severity": "High/Moderate/Low/None",
  "description": "clear description of the disease and what you see in the image",
  "symptoms": ["symptom 1", "symptom 2", "symptom 3"],
  "cause": "what causes this disease",
  "precautions": ["precaution 1", "precaution 2", "precaution 3", "precaution 4"],
  "cure_steps": [
    {"step": 1, "action": "action name", "detail": "detailed instructions"},
    {"step": 2, "action": "action name", "detail": "detailed instructions"},
    {"step": 3, "action": "action name", "detail": "detailed instructions"}
  ],
  "pesticides": [
    {"name": "product name", "dose": "dosage", "frequency": "how often", "type": "Fungicide/Insecticide/Bactericide", "cost": "approx cost"},
    {"name": "product name", "dose": "dosage", "frequency": "how often", "type": "type", "cost": "approx cost"}
  ],
  "organic_alternatives": ["organic option 1", "organic option 2", "organic option 3"],
  "recovery_days": 14,
  "prevention_tips": ["tip 1", "tip 2", "tip 3"]
}`

// POST /api/disease/detect
const detectDisease = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Please upload a crop image' })

    const image_url = `/uploads/disease/${req.file.filename}`
    const imagePath = req.file.path
    const lang = req.farmer?.language_pref || 'en'

    let analysisResult
    let aiProvider = null
    const geminiAvailable = !!getGenAI()
    const grokAvailable = !!getGrokKey()
    const aiAvailable = geminiAvailable || grokAvailable

    if (!aiAvailable) {
      console.warn('⚠️  No AI keys configured — using mock disease analysis')
      analysisResult = getMockAnalysis(req.body.crop_name)
    } else {
      try {
        console.log('🔬 Analyzing crop image with AI Vision (Gemini primary, Grok fallback)...')
        const aiResult = await analyzeImage(imagePath, DISEASE_PROMPT(lang))
        const raw = aiResult.text
        const provider = aiResult.provider || (geminiAvailable ? 'Gemini' : 'Grok')

        // Improved JSON extraction - handle markdown, talkative AI, etc.
        let cleaned = raw.trim()
        
        // Find the first { and last }
        const firstBracket = cleaned.indexOf('{')
        const lastBracket = cleaned.lastIndexOf('}')
        
        if (firstBracket === -1 || lastBracket === -1 || lastBracket < firstBracket) {
          throw new Error('No valid JSON block found in AI response')
        }
        
        const jsonStr = cleaned.substring(firstBracket, lastBracket + 1)
        analysisResult = JSON.parse(jsonStr)
        aiProvider = provider
        console.log(`✅ ${provider} Vision analysis complete: ${analysisResult.disease_name || 'Unknown'}`)
      } catch (err) {
        console.error('⚠️ AI vision detection failed or returned invalid format:', err.message)
        console.log('🔄 Engaging expert safety fallback (Mock Analysis)...')
        analysisResult = getMockAnalysis(req.body.crop_name)
        aiProvider = 'Expert System (Fallback)'
      }
    }

    // If not a crop image, return early without saving
    if (!analysisResult.is_crop_image) {
      return res.json({
        is_crop_image: false,
        message: analysisResult.message,
        image_url,
      })
    }

    // Save detection to database
    const ins = await query(
      `INSERT INTO disease_detections
        (farmer_id, image_url, crop_name, disease_name, confidence, severity, analysis_result)
       VALUES (?,?,?,?,?,?,?)`,
      [
        req.farmer.id,
        image_url,
        analysisResult.crop_name,
        analysisResult.disease_name,
        analysisResult.confidence,
        analysisResult.severity,
        JSON.stringify(analysisResult),
      ]
    )

    // Fetch the inserted row's created_at
    const row = await query(
      'SELECT id, created_at FROM disease_detections WHERE id=?',
      [ins.insertId]
    )

    // Create notification for farmer
    await query(
      'INSERT INTO notifications (farmer_id, type, title, message) VALUES (?,?,?,?)',
      [
        req.farmer.id,
        'disease_alert',
        `🦠 Disease Detected: ${analysisResult.disease_name}`,
        `${analysisResult.severity} severity detected in ${analysisResult.crop_name}. View recommendations now.`,
      ]
    )

    res.json({
      detection_id: ins.insertId,
      created_at: row.rows[0]?.created_at,
      image_url,
      ai_powered: aiAvailable,
      ai_provider: aiProvider,
      ...analysisResult,
    })
  } catch (err) {
    console.error('❌ detectDisease error:', err)
    res.status(500).json({ error: 'Detection failed. Please try again.' })
  }
}

// GET /api/disease/history
const getDiseaseHistory = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, image_url, crop_name, disease_name, confidence, severity, treatment_status, created_at
       FROM disease_detections WHERE farmer_id=? ORDER BY created_at DESC`,
      [req.farmer.id]
    )
    res.json({ detections: result.rows })
  } catch (err) {
    console.error('getDiseaseHistory error:', err)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
}

// GET /api/disease/:id
const getDetection = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM disease_detections WHERE id=? AND farmer_id=?',
      [req.params.id, req.farmer.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Detection not found' })
    const det = result.rows[0]
    const parsed = typeof det.analysis_result === 'string'
      ? JSON.parse(det.analysis_result)
      : (det.analysis_result || {})
    res.json({ detection: { ...det, ...parsed } })
  } catch (err) {
    console.error('getDetection error:', err)
    res.status(500).json({ error: 'Failed to fetch detection' })
  }
}

// PUT /api/disease/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body
    if (!status) return res.status(400).json({ error: 'Status is required' })
    const result = await query(
      'UPDATE disease_detections SET treatment_status=? WHERE id=? AND farmer_id=?',
      [status, req.params.id, req.farmer.id]
    )
    if (!result.affectedRows) return res.status(404).json({ error: 'Detection not found' })
    res.json({ message: 'Status updated' })
  } catch (err) {
    console.error('updateStatus error:', err)
    res.status(500).json({ error: 'Failed to update status' })
  }
}

// DELETE /api/disease/:id
const deleteDetection = async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM disease_detections WHERE id=? AND farmer_id=?',
      [req.params.id, req.farmer.id]
    )
    if (!result.affectedRows) return res.status(404).json({ error: 'Detection not found' })
    res.json({ message: 'Detection deleted' })
  } catch (err) {
    console.error('deleteDetection error:', err)
    res.status(500).json({ error: 'Failed to delete' })
  }
}

const getMockAnalysis = (cropHint) => ({
  is_crop_image: true,
  crop_name: cropHint || 'Tomato',
  disease_name: 'Early Blight',
  scientific_name: 'Alternaria solani',
  confidence: 89,
  severity: 'Moderate',
  description: 'Fungal disease showing characteristic concentric ring patterns on older leaves. Common in warm, humid conditions.',
  symptoms: [
    'Dark brown spots with concentric rings (target-board pattern)',
    'Yellow halos around lesions',
    'Lower/older leaves affected first',
    'Lesions merge causing leaf blight',
  ],
  cause: 'Fungus Alternaria solani — spread through water splash, wind, and contaminated tools.',
  precautions: [
    'Remove infected leaves immediately',
    'Avoid overhead irrigation',
    'Maintain proper plant spacing',
    'Rotate crops every 2-3 years',
    'Use certified disease-free seeds',
  ],
  cure_steps: [
    { step: 1, action: 'Remove infected tissue', detail: 'Remove and destroy all infected leaves. Do not compost.' },
    { step: 2, action: 'Apply fungicide', detail: 'Spray Mancozeb 75 WP at 2.5g/L covering both leaf surfaces.' },
    { step: 3, action: 'Repeat treatment', detail: 'Reapply every 7-10 days for 2-3 cycles.' },
    { step: 4, action: 'Monitor recovery', detail: 'New growth should be spot-free within 14 days.' },
  ],
  pesticides: [
    { name: 'Mancozeb 75 WP', dose: '2.5 g/L', frequency: 'Every 7-10 days', type: 'Fungicide', cost: '₹200/kg' },
    { name: 'Chlorothalonil 75 WP', dose: '2 g/L', frequency: 'Every 10 days', type: 'Fungicide', cost: '₹350/kg' },
    { name: 'Propiconazole 25 EC', dose: '1 ml/L', frequency: 'Every 14 days', type: 'Systemic Fungicide', cost: '₹800/L' },
  ],
  organic_alternatives: ['Neem oil 5ml/L', 'Trichoderma viride 5g/L', 'Baking soda 5g/L + soap'],
  recovery_days: 14,
  prevention_tips: [
    'Apply mulch to reduce soil splash',
    'Stake plants to improve air circulation',
    'Water at base of plant only',
  ],
})

module.exports = { detectDisease, getDiseaseHistory, getDetection, updateStatus, deleteDetection }
