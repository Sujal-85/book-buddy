
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY_LOCAL || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY_LOCAL or GEMINI_API_KEY not found in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    // The @google/generative-ai SDK does not have a direct listModels method.
    // We can use a different approach or just check common names.
    // However, we can use the REST API via fetch if the SDK is limited.
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("✅ Available Models:");
      data.models.forEach(model => {
        console.log(`- ${model.name} (v${model.version || 'unknown'}): ${model.displayName}`);
      });
    } else {
      console.error("❌ No models found or error:", data);
    }
  } catch (error) {
    console.error("❌ Error listing models:", error);
  }
}

listModels();
