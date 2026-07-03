# 🌱 Farmiti v2.0 - Expert User Guide

Welcome to the advanced version of **Farmiti**. This guide explains the high-end agricultural intelligence features now integrated into your dashboard.

---

## 🛰️ 1. Geographic Command Center (Farm Map)
The Map is now your farm's "Mission Control." It uses precise satellite data and live geocoding.

### How to Use:
*   **Auto-Location**: When you sign up, simply enter your **Pincode and City**. The system automatically finds your Latitude/Longitude and saves it.
*   **Farmer Marker**: Your land is marked with a **Green Pin**. Clicking it shows your current crop, land size, and soil health overview.
*   **Resource Toggles**: Use the buttons in the top-right to find:
    *   🏢 **Procurement Centers (Blue)**: Government and private hubs to sell your bulk produce.
    *   🏪 **Mandi Markets (Amber)**: Local markets for daily crop trading.
*   **Live Distance**: Click any center or market pin to see the **exact live distance** (in KM) from your farm, calculated using the Haversine formula.

---

## 📈 2. AI Market Strategist
The Market page now provides deep financial insights, not just prices.

### How to Use:
1.  Navigate to the **Market Prices** tab.
2.  Search or select a **Crop** from the list.
3.  On the right sidebar, the **Kisan Strategist** will instantly analyze the data:
    *   **Market Sentiment**: Tells you if the market is "Bullish" (Prices up) or "Bearish" (Prices down).
    *   **Recommended Action**: Gives you a clear directive: **Sell Now**, **Wait**, or **Hold**.
    *   **Market Logic**: Explains *why* the AI made that decision.
    *   **Price Projection**: A 7-day forecast chart showing where the price is headed.

---

## 🔑 3. Unlimited API Key Rotation (For Developers)
To ensure the app never crashes due to "Too Many Requests," we have implemented a **Bulletproof Rotation System**.

### Configuration in `.env`:
Instead of one key, you can now provide multiple keys separated by commas. The system will rotate them automatically.

```env
# Add as many keys as you want for unlimited AI
GEMINI_API_KEYS=key1,key2,key3

# Supports both xAI (Grok) and Groq (Ultra-fast) fallback
GROK_API_KEYS=gsk_5LXfApOs...,xai-anotherkey...
```

*   **Groq Support**: Keys starting with `gsk_` are automatically routed to the high-speed Groq API.
*   **Fault Tolerance**: If Gemini fails, it falls back to Groq instantly.

---

## 🧪 4. Soil & Environmental Intelligence
Your dashboard now tracks soil reports joined with GPS data.

*   **Soil Reports**: View Nitrogen, pH, and Moisture levels directly on the map HUD.
*   **Hyper-Local Weather**: Weather predictions are now calculated based on your farm's **exact coordinates**, making them 10x more accurate than city-level weather.

---

**Farmiti v2.0** is designed to give Indian farmers the technology usually reserved for large industrial farms. Use these tools to maximize your profit and protect your crops!
