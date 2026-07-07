const { generateText, chatWithHistory } = require('../controllers/geminiHelper');
require('dotenv').config();

async function testFix() {
  console.log('🧪 Testing AI Fix...');
  
  try {
    console.log('\n1. Testing Text Generation (Crops)...');
    const textResult = await generateText('Recommend 3 crops for clay soil in Tamil Nadu');
    console.log('Result Provider:', textResult.provider);
    console.log('Result Snippet:', textResult.text.substring(0, 100) + '...');
    
    console.log('\n2. Testing Chat History...');
    const chatResult = await chatWithHistory(
      [{ role: 'user', content: 'What is the best time to sow rice?' }],
      { state: 'Tamil Nadu', language_pref: 'en' }
    );
    console.log('Result Provider:', chatResult.provider);
    console.log('Result Snippet:', chatResult.text.substring(0, 100) + '...');
    
    console.log('\n✅ AI Fix verification complete!');
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
  }
}

testFix();
