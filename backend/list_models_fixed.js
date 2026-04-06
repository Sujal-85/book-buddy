
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_LOCAL || "");

async function listModels() {
  try {
    const list = await genAI.listModels();
    console.log("--- Available Models ---");
    for (const model of list.models) {
      console.log(`- ${model.name} (${model.displayName})`);
    }
    console.log("------------------------");
  } catch (error) {
    console.error("Error listing models:", error.message);
  }
}

listModels();
