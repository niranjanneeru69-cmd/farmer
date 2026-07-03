const multer = require('multer')
const path = require('path')
const fs = require('fs')
const ensureDir = (d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }) }
const diseaseStorage = multer.diskStorage({
  destination: (req, file, cb) => { const d = path.join(__dirname,'../uploads/disease'); ensureDir(d); cb(null,d) },
  filename: (req, file, cb) => cb(null, `disease-${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`)
})
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => { const d = path.join(__dirname,'../uploads/avatars'); ensureDir(d); cb(null,d) },
  filename: (req, file, cb) => cb(null, `avatar-${req.farmer.id}-${Date.now()}${path.extname(file.originalname)}`)
})
const imageFilter = (req, file, cb) => file.mimetype.startsWith('image/') ? cb(null,true) : cb(new Error('Images only'),false)
module.exports = {
  uploadDisease: multer({ storage:diseaseStorage, fileFilter:imageFilter, limits:{fileSize:10*1024*1024} }),
  uploadAvatar:  multer({ storage:avatarStorage,  fileFilter:imageFilter, limits:{fileSize:5*1024*1024} }),
}
