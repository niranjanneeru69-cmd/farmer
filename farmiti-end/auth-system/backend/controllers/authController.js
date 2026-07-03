import nodemailer from 'nodemailer';
import { saveOTP, verifyOTP } from '../utils/otpStore.js';
import dotenv from 'dotenv';

dotenv.config();

// Create Nodemailer Transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter on startup
transporter.verify((error, success) => {
    if (error) {
        console.log('[MAIL] Transporter verification failed:', error.message);
    } else {
        console.log('[MAIL] Server is ready to send emails');
    }
});

export const sendOTP = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    saveOTP(email, otp);

    console.log(`[AUTH] Generated OTP for ${email}: ${otp}`);

    const mailOptions = {
        from: `"SecureAuth" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #333;">Verification Code</h2>
                <p>Use the following OTP to complete your sign-in process. This code is valid for 5 minutes.</p>
                <div style="font-size: 24px; font-weight: bold; color: #4F46E5; padding: 10px; background: #F3F4F6; display: inline-block; border-radius: 4px;">
                    ${otp}
                </div>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't request this, please ignore this email.</p>
            </div>
        `,
    };

    try {
        // Validation check for Gmail configuration
        const isConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS && !process.env.EMAIL_PASS.includes('your_gmail');
        
        if (!isConfigured) {
            console.log(`[DEV MODE] Gmail not configured properly. Use the OTP above.`);
            return res.status(200).json({ 
                message: 'OTP logged to server console (Dev Mode)',
                dev: true,
                otp: otp
            });
        }

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${email}`);
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Nodemailer Error:', error);
        
        // Fallback for development
        console.log(`[FALLBACK] Email failed, but you can use this OTP: ${otp}`);
        
        res.status(200).json({ 
            message: 'Email delivery failed, but OTP is available in server console', 
            dev: true,
            otp: otp 
        });
    }
};

export const verifyUserOTP = (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const isValid = verifyOTP(email, otp);

    if (isValid) {
        res.status(200).json({ message: 'OTP verified successfully', success: true });
    } else {
        res.status(400).json({ message: 'Invalid or expired OTP', success: false });
    }
};
