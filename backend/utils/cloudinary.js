const cloudinary = require('cloudinary').v2
const fs = require('fs')

const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

/**
 * Uploads a local file to Cloudinary.
 * @param {string} filePath - Absolute path to the local file
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<string|null>} - Secure URL of the uploaded image, or null if Cloudinary is not configured
 */
const uploadImage = async (filePath, folder = 'farmiti') => {
  if (!isCloudinaryConfigured()) {
    console.warn('⚠️ Cloudinary is not configured. Serving local file path.')
    return null
  }
  try {
    const result = await cloudinary.uploader.upload(filePath, { folder })
    return result.secure_url
  } catch (err) {
    console.error('❌ Cloudinary upload error:', err.message)
    throw err
  }
}

/**
 * Extracts public ID from a Cloudinary URL.
 * @param {string} url - Cloudinary image URL
 * @returns {string|null} - Public ID or null
 */
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary')) return null
  try {
    const parts = url.split('/upload/')
    if (parts.length < 2) return null
    const rest = parts[1].replace(/^v\d+\//, '')
    return rest.substring(0, rest.lastIndexOf('.')) || rest
  } catch (err) {
    console.error('Failed to parse Cloudinary URL:', err.message)
    return null
  }
}

/**
 * Deletes an image from Cloudinary by its URL.
 * @param {string} url - Cloudinary image URL
 */
const deleteImage = async (url) => {
  if (!isCloudinaryConfigured()) return
  const publicId = getPublicIdFromUrl(url)
  if (!publicId) return
  try {
    await cloudinary.uploader.destroy(publicId)
    console.log(`🗑️ Deleted image from Cloudinary: ${publicId}`)
  } catch (err) {
    console.error('❌ Cloudinary delete error:', err.message)
  }
}

module.exports = {
  isCloudinaryConfigured,
  uploadImage,
  deleteImage,
}
