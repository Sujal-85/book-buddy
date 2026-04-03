import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import dotenv from 'dotenv';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
dotenv.config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Model configurations for different use cases
export const MODELS = {
  // Fast, efficient model for simple tasks
  FLASH: 'gemini-2.5-flash',
  // Powerful model for complex reasoning
  PRO: 'gemini-3-flash-preview',
  // Latest model with best performance
  PRO_LATEST: 'gemini-2.5-pro',
};

class GeminiService {
  private models: Map<string, GenerativeModel> = new Map();

  constructor() {
    this.initializeModels();
  }

  private initializeModels() {
    Object.entries(MODELS).forEach(([key, modelName]) => {
      this.models.set(key, genAI.getGenerativeModel({ model: modelName }));
    });
  }

  getModel(modelKey: keyof typeof MODELS = 'FLASH'): GenerativeModel {
    const model = this.models.get(modelKey);
    if (!model) {
      throw new Error(`Model ${modelKey} not found`);
    }
    return model;
  }

  // A. Chat/Conversation
  async chat(message: string, history: Array<{role: string, parts: string}> = [], modelKey: keyof typeof MODELS = 'PRO') {
    const model = this.getModel(modelKey);
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.parts }]
      })),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  }

  // B. Text Summarization
  async summarize(text: string, maxLength: number = 500, modelKey: keyof typeof MODELS = 'FLASH') {
    const model = this.getModel(modelKey);
    const prompt = `Summarize the following text in ${maxLength} characters or less. Be concise and capture the main points:

${text}`;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  // C. Book Recommendations (Strict Database-Only)
  async getBookRecommendations(preferences: string, genres: string[] = [], count: number = 5, libraryBooks: any[] = []) {
    const model = this.getModel('PRO');
    
    // Prepare library context (limit to top 50 for token efficiency if too many)
    const context = libraryBooks.slice(0, 50).map(b => 
      `- ${b.title} by ${b.author} [Category: ${b.category || 'General'}] (Available: ${b.available})`
    ).join('\n');

    const prompt = `
      As a specialized Library AI Assistant, your task is to recommend ${count} books from our ACTUAL library database based on these preferences: "${preferences}" ${genres.length > 0 ? 'and genres: ' + genres.join(', ') : ''}.

      ### 📚 YOUR LIBRARY DATABASE (ONLY RECOMMEND FROM THESE):
      ${context || 'No books provided in context.'}

      ### 🏠 RULES:
      1. **STRICT DATABASE ONLY**: You MUST NOT recommend any book that is not in the list provided above.
      2. **Hallucination Check**: If you cannot find a good match in the list, provide the closest possible match from the list and explain why it's the best choice currently available, or suggest a broader category from the list.
      3. **Availability**: You can recommend unavailable books but must note they are currently checked out.
      4. **Response Format**: You MUST return a valid JSON array of objects.

      ### 📝 OUTPUT FORMAT (JSON ONLY):
      [
        {
          "title": "Book Title",
          "author": "Author Name",
          "description": "2-3 sentence summary of the book's content",
          "matchReason": "Why this specific book from our database matches your request",
          "category": "The category from the database"
        }
      ]

      Return ONLY the JSON array. Do not include any conversational text before or after the JSON.
    `;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Robust JSON extraction (handles ```json ... ``` or raw text)
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const jsonMatch = cleanedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: try parsing the whole cleaned text
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('Error in getBookRecommendations:', error);
      throw new Error('Failed to generate valid library recommendations');
    }
  }

  // D. Voice Search Query Processing
  async processVoiceQuery(transcript: string) {
    const model = this.getModel('PRO');
    const prompt = `Process this voice search query for a library system and extract search parameters:
"${transcript}"

Return a JSON object with:
- searchTerms: main search keywords
- bookTitle: specific book title if mentioned (null if not)
- author: specific author if mentioned (null if not)
- genre: genre if mentioned (null if not)
- intent: one of [search, borrow, return, info, recommendation]
- confidence: number 0-1`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { searchTerms: transcript, intent: 'search', confidence: 0.5 };
    } catch {
      return { searchTerms: transcript, intent: 'search', confidence: 0.5 };
    }
  }

  // E. Study Companion / Personalized Tutor
  async studyCompanion(question: string, context?: any) {
    const model = this.getModel('PRO');
    const { userProfile = {}, libraryBooks = [], history = [], fileData = [] } = context || {};
    const libraryContext = (libraryBooks && libraryBooks.length > 0) 
      ? libraryBooks.map((b: any) => `${b.title} by ${b.author} (${b.category})`).join(', ')
      : "No specific books available in the current inventory sample.";

    const systemPrompt = `
      You are the "Master Tutor" of the Book Buddy platform, an elite AI study companion.
      Your mission is to help students (like ${userProfile.name || 'User'}, who is studying ${userProfile.branch || 'their field'}) master subjects using the **Feynman Technique**.

      ---

      ### 🎨 FORMATTING REQUIREMENTS (MANDATORY)
      To make your responses "Premium" and "Rich", you MUST use:
      1. **Horizontal Rules (---)**: To separate different segments of your explanation.
      2. **Blockquotes (>)**: To highlight key definitions or "Mindset Shifts".
      3. **Emojis**: Sparingly but effectively to convey warmth and enthusiasm (🌟, 💡, 🚀).
      4. **Structured Tables**: When comparing two concepts or listing pros/cons.
      5. **Bold & Italic**: To emphasize technical terms vs simple analogies.

      ---

      ### 🕵️ DATABASE GROUNDING (CRITICAL)
      When recommending books or study materials, you MUST ONLY suggest items from the following "Library Inventory":
      [INVENTORY]: ${libraryContext}

      - **STRICT RULE**: Never recommend a book that is not in the [INVENTORY] list. 
      - If no relevant books exist in the inventory for a specific query, suggest the closest match or provide a theoretical explanation instead. 
      - DO NOT hallucinate book titles.
      - Mention if a book is current "Available" or "Issued" based on the inventory data.

      ---

      ### 🧠 THE MASTER TUTOR STRATEGY
      1. **User Connection**: Always start by acknowledging the user personally if their name (${userProfile.name || 'User'}) is known. Use their branch (${userProfile.branch || 'General Studies'}) to create relatable technical analogies.
      2. **The Feynman Core**: 
         - **Step A**: Explain the concept as if to a 10-year-old.
         - **Step B**: Use a "Real World Analogy" that fits their student life.
         - **Step C**: Identify any "Jargon" and break it down immediately.
      ---

      ### 📚 STRICT DATABASE RECOMMENDATION RULES (CRITICAL)
      1. **ONLY Recommend from Context**: You MUST NOT mention any book title that is not found in the library database provided above.
      2. **Availability Check**: If a book is mentioned in the context as \`available: false\`, warn the student but suggest it as a reading goal.
      3. **No Hallucinations**: If you cannot find a book title for a specific topic, say "I don't have a specific book for [topic] in our database yet."
      4. **Branch Alignment**: Always prioritize books that match their branch.

      ---

      ### 🎭 PERSONALITY
      - You are **Obsessively Encouraging**. You believe the student is a genius waiting to happen.
      - You are **Human-Centric**. You talk like a brilliant, slightly quirky senior student who loves teaching.
      - **NO ROBOTIC PRELUDES**. Don't say "As an AI..." or "I can help you...". Just start the conversation!

      ---

      **CONTEXT FOR THIS REQUEST**:
      - The student has provided a question: "${question}"
      - They have also uploaded ${fileData.length} file(s) (Images/PDFs). 
      - Use the technical details from the attached files to enrich your explanation.
    `;

    // Construct multi-modal parts
    const parts: any[] = [{ text: systemPrompt }];
    
    if (fileData && fileData.length > 0) {
      fileData.forEach((file: any) => {
        parts.push({
          inlineData: {
            data: file.data, // base64 string
            mimeType: file.mimeType
          }
        });
      });
    }

    const result = await model.generateContent(parts);
    return result.response.text();
  }

  // F. Book Review Analysis
  async analyzeReviews(reviews: string[]) {
    const model = this.getModel('PRO');
    const reviewsText = reviews.map((r, i) => `Review ${i + 1}: ${r}`).join('\n\n');
    const prompt = `Analyze these book reviews and provide insights:

${reviewsText}

Return a JSON object with:
- overallSentiment: 'positive' | 'negative' | 'mixed'
- sentimentScore: number 0-100
- keyThemes: array of main themes mentioned
- commonPraises: array of what readers liked
- commonComplaints: array of what readers disliked
- briefSummary: 2-3 sentence summary of overall opinion`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return text;
    } catch {
      return text;
    }
  }

  // G. AI Analytics - Data Analysis
  async analyzeLibraryData(data: any, analysisType: string) {
    const model = this.getModel('PRO');
    const prompt = `Analyze this library data and provide ${analysisType} insights:

${JSON.stringify(data, null, 2)}

Provide:
1. Key findings
2. Trends identified
3. Recommendations
4. Actionable insights for library management`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  // H. Damage Detection from Image Description
  async detectDamage(imageDescription: string, bookCondition: string) {
    const model = this.getModel('PRO');
    const prompt = `Analyze this book condition report:
Image description: ${imageDescription}
Reported condition: ${bookCondition}

Determine:
- damageLevel: 'none' | 'minor' | 'moderate' | 'severe'
- damageTypes: array of damage types (water, tear, writing, stain, etc.)
- repairable: boolean
- recommendedFine: number (estimated repair cost in dollars, 0 if none)
- notes: brief assessment notes

Return as JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return text;
    } catch {
      return text;
    }
  }

  // I. Fine Calculation Assistant
  async calculateFine(overdueDays: number, bookValue: number, bookCondition: string, userHistory: string) {
    const model = this.getModel('PRO');
    const prompt = `Calculate an appropriate library fine for:
- Overdue days: ${overdueDays}
- Book value: $${bookValue}
- Book condition upon return: ${bookCondition}
- User borrowing history: ${userHistory}

Consider standard library fine structures ($0.25-$2 per day overdue, plus damage fees).
Return JSON with:
- baseFine: number
- damageFee: number
- totalFine: number
- reasoning: brief explanation`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return text;
    } catch {
      return text;
    }
  }

  // J. AI Cataloging - Auto-generate metadata
  async generateCatalogData(bookInfo: { title: string; author: string; description?: string; isbn?: string }) {
    const model = this.getModel('PRO');
    const prompt = `Generate library catalog metadata for:
Title: ${bookInfo.title}
Author: ${bookInfo.author}
${bookInfo.description ? `Description: ${bookInfo.description}` : ''}
${bookInfo.isbn ? `ISBN: ${bookInfo.isbn}` : ''}

Return JSON with:
- subjects: array of subject categories (Dewey Decimal style)
- keywords: array of searchable keywords
- targetAudience: 'children' | 'young adult' | 'adult' | 'all ages'
- genre: primary genre
- suggestedShelfLocation: brief location code
- summary: 2-3 sentence summary`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return text;
    } catch {
      return text;
    }
  }

  // K. Smart Notifications - Generate personalized message
  async generateNotification(type: string, userData: any, context?: any) {
    const model = this.getModel('FLASH');
    const prompt = `Generate a personalized library notification:
Type: ${type} (e.g., 'overdue', 'due soon', 'book available', 'recommendation')
User: ${JSON.stringify(userData)}
Context: ${JSON.stringify(context)}

Write a friendly, professional message (2-3 sentences) that is personalized and actionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  // L. AI Reports - Generate report content
  async generateReport(reportType: string, data: any, period: string) {
    const model = this.getModel('PRO');
    const prompt = `Generate a ${reportType} library report for the period: ${period}

Data:
${JSON.stringify(data, null, 2)}

Include:
1. Executive summary
2. Key metrics and statistics
3. Notable trends or patterns
4. Comparison to previous period (if applicable)
5. Recommendations

Format as professional report content.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  // M. Shelf Management - Organization suggestions
  async suggestShelfOrganization(books: any[], constraints: any) {
    const model = this.getModel('PRO');
    const prompt = `Suggest shelf organization for these books:
Books: ${JSON.stringify(books)}
Constraints: ${JSON.stringify(constraints)}

Return JSON with:
- sections: array of shelf sections with name and book ranges
- rationale: brief explanation of organization logic
- spaceUtilization: percentage estimate
- recommendations: array of suggestions for optimization`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return text;
    } catch {
      return text;
    }
  }

  // N. Reading Goal Assistant
  async assistReadingGoal(currentProgress: number, goal: number, timeframe: string, readingSpeed?: string) {
    const model = this.getModel('FLASH');
    const prompt = `Help with reading goal:
- Current progress: ${currentProgress} books/pages
- Goal: ${goal} books/pages
- Timeframe: ${timeframe}
- Reading speed: ${readingSpeed || 'moderate'}

Provide:
1. Daily/weekly target to stay on track
2. Tips for achieving the goal
3. Suggested reading schedule
4. Motivational advice
5. Book recommendations if needed`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  // O. Reading Stats Analysis
  async analyzeReadingStats(stats: any) {
    const model = this.getModel('PRO');
    const prompt = `Analyze reading statistics and provide insights:
${JSON.stringify(stats, null, 2)}

Return JSON with:
- readingPersona: brief description of reader type
- strengths: array of positive reading habits
- suggestions: array of improvement tips
- genreDiversity: score 0-100
- monthlyGoals: suggested targets for next month`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return text;
    } catch {
      return text;
    }
  }

  // P. Student Analytics - Performance insights
  async analyzeStudentPerformance(studentData: any, classData?: any) {
    const model = this.getModel('PRO');
    const prompt = `Analyze student library engagement:
Student: ${JSON.stringify(studentData)}
${classData ? `Class context: ${JSON.stringify(classData)}` : ''}

Provide insights on:
1. Reading engagement level
2. Genre preferences and diversity
3. Borrowing patterns
4. Areas for encouragement
5. Personalized recommendations

Be constructive and supportive in tone.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  // Q. Availability Alerts - Predict availability
  async predictAvailability(bookData: any, queueLength: number) {
    const model = this.getModel('FLASH');
    const prompt = `Predict book availability:
Book data: ${JSON.stringify(bookData)}
Current waitlist: ${queueLength} people

Estimate:
- estimatedDaysUntilAvailable: number
- confidence: 'high' | 'medium' | 'low'
- recommendation: should user wait or look for alternative?`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return text;
    } catch {
      return text;
    }
  }

  // R. Bulk Import Processing
  async processBulkImport(booksData: string, format: 'csv' | 'json' | 'text') {
    const model = this.getModel('PRO');
    const prompt = `Process bulk book import data in ${format} format:
${booksData}

Extract and return as JSON array with objects containing:
- title (required)
- author (required)
- isbn (if available)
- genre (if available)
- description (if available)
- status: 'valid' | 'needs_review' | 'incomplete'
- issues: array of any problems with this entry`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return text;
    } catch {
      return text;
    }
  }

  // S. Multi-modal: Analyze image (for damage detection, cover recognition)
  async analyzeImage(imageBase64: string, mimeType: string, promptText: string) {
    const model = this.getModel('PRO');
    
    const result = await model.generateContent([
      promptText,
      {
        inlineData: {
          mimeType,
          data: imageBase64
        }
      }
    ]);
    
    return result.response.text();
  }

  // T. General Text Generation
  async generateText(prompt: string, temperature: number = 0.7, maxTokens: number = 2048) {
    const model = this.getModel('PRO');
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      }
    });
    return result.response.text();
  }

  // U. PDF Summarization
  async summarizePDF(buffer: Buffer, originalName: string) {
    const model = this.getModel('PRO');
    
    try {
      // 1. Extract text from PDF
      const data = await pdf(buffer);
      const text = data.text;
      
      // 2. Truncate if too long (Gemini limits vary, but 30k chars is a safe buffer for Flash/Pro)
      const truncatedText = text.slice(0, 30000);

      const prompt = `
        Summarize the following document titled "${originalName}".
        
        ### 📋 INSTRUCTIONS:
        1. **Executive Summary**: Provide a high-level overview (3-4 sentences).
        2. **Key Concepts**: List the top 5 most important ideas or chapters.
        3. **Detailed Breakdown**: Group core information into logical bullet points.
        4. **Target Audience**: Who would benefit most from this?
        5. **Study Questions**: Suggest 3 questions to test understanding.

        ### 📄 DOCUMENT CONTENT:
        ${truncatedText}
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error parsing PDF or generating summary:', error);
      throw new Error('Failed to process PDF summary');
    }
  }
}

export const geminiService = new GeminiService();
export default geminiService;
