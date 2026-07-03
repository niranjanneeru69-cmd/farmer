const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.error('GEMINI_API_KEY not found in .env');
      return;
    }
    const genAI = new GoogleGenerativeAI(key.trim());
    // The SDK doesn't have a direct listModels but we can try to use a dummy call or use axios
    console.log('Using API Key starts with:', key.substring(0, 5) + '...');
    
    // Actually we can use the REST API to list models
    const axios = require('axios');
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key.trim()}`);
    console.log('Available models:');
    response.data.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
  } catch (error) {
    console.error('Error listing models:', error.response ? error.response.data : error.message);
  }
}

listModels();
