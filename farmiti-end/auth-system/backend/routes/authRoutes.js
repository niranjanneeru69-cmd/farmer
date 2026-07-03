import express from 'express';
import { sendOTP, verifyUserOTP } from '../controllers/authController.js';

const router = express.Router();

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyUserOTP);

export default router;
