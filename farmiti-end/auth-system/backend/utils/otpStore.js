const otpStore = new Map();

/**
 * Save OTP to store with expiration
 * @param {string} email 
 * @param {string} otp 
 * @param {number} ttl - Time to live in minutes
 */
export const saveOTP = (email, otp, ttl = 5) => {
    const expiresAt = Date.now() + ttl * 60 * 1000;
    otpStore.set(email, { otp, expiresAt });
};

/**
 * Verify OTP for an email
 * @param {string} email 
 * @param {string} otp 
 * @returns {boolean}
 */
export const verifyOTP = (email, otp) => {
    const record = otpStore.get(email);
    if (!record) return false;

    const { otp: savedOtp, expiresAt } = record;

    if (Date.now() > expiresAt) {
        otpStore.delete(email);
        return false;
    }

    if (savedOtp === otp) {
        otpStore.delete(email); // Delete after successful verification
        return true;
    }

    return false;
};

// Cleanup expired OTPs periodically
setInterval(() => {
    const now = Date.now();
    for (const [email, record] of otpStore.entries()) {
        if (now > record.expiresAt) {
            otpStore.delete(email);
        }
    }
}, 60 * 1000); // Every minute
