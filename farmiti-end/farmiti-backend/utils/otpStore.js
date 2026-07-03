// In-memory storage for OTPs
// format: { email: { otp: string, expires: timestamp } }
const otpCache = new Map();

/**
 * Save OTP for an email with expiration
 * @param {string} email 
 * @param {string} otp 
 * @param {number} expiryMinutes Default 5 minutes
 */
const saveOTP = (email, otp, expiryMinutes = 5) => {
    const expires = Date.now() + expiryMinutes * 60 * 1000;
    otpCache.set(email, { otp, expires });
    
    // Auto-delete after expiry + 1 minute to keep memory clean
    setTimeout(() => {
        const cached = otpCache.get(email);
        if (cached && cached.expires <= Date.now()) {
            otpCache.delete(email);
        }
    }, (expiryMinutes + 1) * 60 * 1000);
};

/**
 * Verify OTP for an email
 * @param {string} email 
 * @param {string} otp 
 * @returns {boolean}
 */
const verifyOTP = (email, otp) => {
    const cached = otpCache.get(email);
    
    if (!cached) return false;
    
    if (cached.expires < Date.now()) {
        otpCache.delete(email);
        return false;
    }
    
    if (cached.otp === otp) {
        otpCache.delete(email); // One-time use
        return true;
    }
    
    return false;
};

module.exports = { saveOTP, verifyOTP };
