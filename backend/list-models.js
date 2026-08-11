const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
  try {
    const models = await ai.models.list();
    // Wait, the SDK is 'ai.models.list()'? I can just run it using raw REST to be safe
    console.log(models);
  } catch (e) {
    console.error(e);
  }
}
listModels();
