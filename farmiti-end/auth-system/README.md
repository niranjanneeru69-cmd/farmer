# Modern OTP Authentication System

A premium, full-stack authentication system using Node.js for the backend and Vanilla JavaScript for the frontend.

## Features

- **Premium UI**: Modern glassmorphism design with animated backgrounds.
- **OTP Logic**: 6-digit verification code with in-memory storage and expiration.
- **Rate Limiting**: Protects against brute-force attacks.
- **Responsive**: Fully optimized for mobile and desktop.
- **Dev Mode**: If no email credentials are provided, the OTP is logged to the server console.

## Project Structure

```text
auth-system/
├── backend/
│   ├── server.js           # Main entry point
│   ├── .env                # Configuration
│   ├── package.json        # Dependencies
│   ├── routes/             # API routes
│   ├── controllers/        # Business logic
│   ├── utils/              # Helper functions (OTP store)
│   └── middleware/         # Custom middleware (Rate Limiter)
└── frontend/
    ├── index.html          # UI structure
    ├── app.js              # Frontend logic
    └── style.css           # Premium styling
```

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd auth-system/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Configure `.env` with your SMTP details for real email delivery.
4. Start the server:
   ```bash
   npm run dev
   ```
   The backend will run at `http://localhost:5000`.

### 2. Frontend Setup

Simply open `auth-system/frontend/index.html` in any modern web browser.

## How it Works

1. Enter your email address in the frontend.
2. The backend generates a 6-digit OTP and stores it (expiring in 5 minutes).
3. If configured, an email is sent. Otherwise, check the **backend console** for the code.
4. Enter the code in the frontend.
5. If valid, you'll see a success animation.
