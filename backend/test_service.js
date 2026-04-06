
import { geminiService } from "./src/services/geminiService.js";
import dotenv from "dotenv";
dotenv.config();

async function testSummary() {
  try {
    console.log("🧪 Testing Gemini Summary with gemini-2.5-flash...");
    const result = await geminiService.summarize("This is a test summary for the book buddy project.");
    console.log("✅ Summary Result:", result);
  } catch (error) {
    console.error("❌ Summary Failed:", error.message);
  }
}

testSummary();
