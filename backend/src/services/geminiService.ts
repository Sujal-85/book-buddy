import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import dotenv from 'dotenv';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// Handle both CJS and ESM import patterns for pdf-parse
const pdfLib = require('pdf-parse');
const pdf = typeof pdfLib === 'function' ? pdfLib : pdfLib.default;

dotenv.config();

export const MODELS = {
  // Balanced, fast, and cost-efficient for high-volume tasks
  FLASH: 'gemini-2.5-flash',
  
  // High-intelligence flagship model for complex reasoning
  PRO: 'gemini-2.5-flash',
  
  // Experimental/Latest cutting-edge performer
  PRO_LATEST: 'gemini-2.5-flash', 
};

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private models: Map<string, GenerativeModel> = new Map();

  private getGenAI(): GoogleGenerativeAI {
    if (!this.genAI) {
      // Configuration is already called by dotenv.config() at the top of file
      const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_LOCAL;
      
      if (!apiKey) {
        console.error('❌ CRITICAL: GEMINI_API_KEY is not set.');
        throw new Error('GEMINI_API_KEY is missing. In local development, check your .env file. In Firebase production, ensure the secret is set using "firebase functions:secrets:set GEMINI_API_KEY".');
      }
      
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log('🚀 Gemini AI Service initialized successfully.');
    }
    return this.genAI;
  }

  constructor() {
    // Models are initialized lazily in getModel() to ensure env vars are available
  }

  getModel(modelKey: keyof typeof MODELS = 'FLASH'): GenerativeModel {
    let model = this.models.get(modelKey);
    if (!model) {
      const genAI = this.getGenAI();
      const modelName = MODELS[modelKey];
      model = genAI.getGenerativeModel({ model: modelName });
      this.models.set(modelKey, model);
    }
    return model;
  }

  // A. Chat/Conversation
  async chat(message: string, history: Array<{role: string, parts: string}> = [], modelKey: keyof typeof MODELS = 'FLASH') {
    try {
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
    } catch (error: any) {
      console.error('Gemini Chat Error:', error.message);
      
      if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('limit')) {
        console.warn('⚠️ QUOTA EXCEEDED: Using Mock Chat Fallback.');
        return "I'm currently in 'Lite Mode' due to high API traffic (Quota 429). I can still help with basic questions! How can I assist you with your library needs?";
      }
      throw error;
    }
  }

  // B. Text Summarization
  async summarize(text: string, maxLength: number = 2000, modelKey: keyof typeof MODELS = 'PRO') {
    try {
      const model = this.getModel(modelKey);
      const prompt = `
        Summarize the following text provided below.
        
        ### 🎨 STYLE & STRUCTURE (MANDATORY):
        - Output strictly in **Premium Markdown** format.
        - Use H2 (##) for main headings and H3 (###) for sub-sections.
        - Use **Bold** for critical keywords and *Italic* for subtle emphasis.
        - Use a **Detailed Table** to compare key concepts or list pros/cons if applicable.
        - Use **Blockquotes (>)** for profound "Aha!" moments or direct quotes.
        - Use **Bullet points (•)** and **Numbered lists (1.)** for clarify.
        - Incorporate relevant emojis (🚀, 💡, 🧠, 📚) to enhance readability.
        - Add a horizontal rule (---) between major sections.

        ### 🧱 OUTPUT SECTIONS:
        1. **Executive Insight**: A high-impact 2-3 sentence overview.
        2. **Core Pillars**: Use a table or bulleted list for the foundation of the text.
        3. **Deep Dive Analysis**: Break down complex parts into structured sub-sections.
        4. **Actionable Takeaways**: List 3-4 things the reader can DO with this info.
        5. **Critical Thinking**: 2 review questions to master the content.
        
        ### 📄 TEXT CONTENT:
        ${text.slice(0, 15000)}
      `;
      
      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();
      
      // Clean up markdown code block wrappers if present
      return textResponse.replace(/^```markdown\n/, '').replace(/```$/, '').trim();
    } catch (error: any) {
      if (error.message?.includes('429')) {
        return text.slice(0, 1000) + "\n\n**Note: Summary limited due to API quota. Please try again soon.**";
      }
      throw error;
    }
  }

  // C. Book Recommendations (Strict Database-Only)
  async getBookRecommendations(preferences: string, genres: string[] = [], count: number = 5, libraryBooks: any[] = [], studentHistory: any[] = []) {
    const model = this.getModel('FLASH');
    
    // Prepare library context (limit to top 50 for token efficiency if too many)
    const context = libraryBooks.slice(0, 50).map(b => 
      `- ${b.title} by ${b.author} [Category: ${b.category || 'General'}] (Available: ${b.available})`
    ).join('\n');

    // Prepare student history context
    const historyContext = studentHistory.length > 0 
      ? studentHistory.map(h => `- ${h.title} (${h.category}) - Status: ${h.status}`).join('\n')
      : "No previous borrowing history.";

    const prompt = `
      As a specialized Library AI Assistant, your task is to recommend ${count} books from our ACTUAL library database based on these student details:
      
      ### 👤 STUDENT PROFILE:
      - Preferences: "${preferences}"
      - Genres of interest: ${genres.length > 0 ? genres.join(', ') : 'Not specified'}
      - Borrowing History:
      ${historyContext}

      ### 📚 YOUR LIBRARY DATABASE (ONLY RECOMMEND FROM THESE):
      ${context || 'No books provided in context.'}

      ### 🏠 RULES:
      1. **STRICT DATABASE ONLY**: You MUST NOT recommend any book that is not in the list provided above.
      2. **Personalization**: Use the student's history to avoid recommending books they have already read (unless they are part of a series) and to better match their taste.
      3. **Hallucination Check**: If you cannot find a good match in the list, provide the closest possible match from the list and explain why it's the best choice currently available.
      4. **Availability**: You can recommend unavailable books but must note they are currently checked out.
      5. **Response Format**: You MUST return a valid JSON array of objects.

      ### 📝 OUTPUT FORMAT (JSON ONLY):
      [
        {
          "title": "Book Title",
          "author": "Author Name",
          "description": "2-3 sentence summary of the book's content",
          "matchReason": "Why this specific book from our database matches your request and history",
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
    } catch (error: any) {
      if (error.message?.includes('429')) {
        console.warn('⚠️ QUOTA EXCEEDED: Using Recommendations Mock Fallback.');
        return [
          { 
            title: "Artificial Intelligence: A Modern Approach", 
            author: "Stuart Russell", 
            description: "A comprehensive guide to the theory and practice of AI.",
            matchReason: "Highly relevant to your interest in technology and AI.",
            category: "Technology"
          },
          { 
            title: "Clean Code", 
            author: "Robert C. Martin", 
            description: "Essential reading for writing maintainable and clear software.",
            matchReason: "Suggested for students focused on branch excellence.",
            category: "Computer Science"
          }
        ];
      }
      console.error('Error in getBookRecommendations:', error);
      throw new Error('Failed to generate valid library recommendations');
    }
  }

  // D. Voice Search Query Processing
  async processVoiceQuery(transcript: string) {
    try {
      const model = this.getModel('FLASH');
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
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { searchTerms: transcript, intent: 'search', confidence: 0.5 };
    } catch (error: any) {
      if (error.message?.includes('429')) {
        console.warn('⚠️ QUOTA EXCEEDED: Using Voice Parser Fallback.');
        // Simple regex fallback
        const lower = transcript.toLowerCase();
        let intent = 'search';
        if (lower.includes('borrow') || lower.includes('issue')) intent = 'borrow';
        else if (lower.includes('return') || lower.includes('give back')) intent = 'return';
        else if (lower.includes('recommend') || lower.includes('suggest')) intent = 'recommendation';
        
        return { 
          searchTerms: transcript, 
          intent: intent as any, 
          confidence: 0.9, 
          isMock: true 
        };
      }
      throw error;
    }
  }

  // E. Study Companion / Personalized Tutor
  async studyCompanion(question: string, context?: any) {
    const model = this.getModel('FLASH');
    const { userProfile = {}, libraryBooks = [], history = [], fileData = [] } = context || {};
    const libraryContext = (libraryBooks && libraryBooks.length > 0) 
      ? libraryBooks.map((b: any) => `${b.title} by ${b.author} (${b.category})`).join(', ')
      : "No specific books available in the current inventory sample.";

    const historyContext = (history && history.length > 0)
      ? history.map((h: any) => `- ${h.title} (${h.category}) - Status: ${h.status}`).join('\n')
      : "No previous borrowing history.";

    const systemPrompt = `
      You are the "Master Tutor" of the Book Buddy platform, an elite AI study companion.
      Your mission is to help students (like ${userProfile.name || 'User'}, who is studying ${userProfile.branch || 'their field'}) master subjects using the **Feynman Technique**.

      ### 👤 STUDENT PROFILE:
      - Name: ${userProfile.name || 'User'}
      - Field of Study: ${userProfile.branch || 'General'}
      - Recent Reading History:
      ${historyContext}

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

    try {
      const result = await model.generateContent(parts);
      const text = result.response.text();
      
      if (!text) {
        throw new Error('Empty response from AI model');
      }

      return text;
    } catch (error: any) {
      console.error('Gemini Study Companion Error:', error);
      
      // Handle clear quota errors
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        throw new Error('AI service is temporarily busy due to high demand. Please try again in a minute.');
      }
      
      throw new Error(`AI Study Companion failed: ${error.message || 'Unknown error'}`);
    }
  }

  // F. Book Review Analysis
  async analyzeReviews(reviews: string[]) {
    const model = this.getModel('FLASH');
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
    
    return this.extractJSON(text) || text;
  }

  // G. AI Analytics - Data Analysis
  async analyzeLibraryData(data: any, analysisType: string) {
    const model = this.getModel('FLASH');
    const prompt = `
      Analyze this library data and provide ${analysisType} insights.
      
      ### 📊 DATA CONTEXT:
      ${JSON.stringify(data, null, 2)}

      ### 🏠 RULES:
      1. **Return ONLY valid JSON**.
      2. **Structure**: The response must be a JSON object with the following keys:
         - "stats": Array of 4 stat objects { label, value, change (e.g. "+5%"), type (circulation|members|duration|accuracy) }
         - "predictions": Array of 2-4 prediction objects { title, description, confidence (0-100), type (trend|alert|insight|engagement) }
         - "inventoryAlerts": Array of objects { category, current, needed, urgency (high|medium|low) }
         - "aiSummary": A detailed markdown summary of the findings (200-300 words).

      ### 📝 OUTPUT FORMAT (JSON ONLY):
      {
        "stats": [...],
        "predictions": [...],
        "inventoryAlerts": [...],
        "aiSummary": "markdown content..."
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return this.extractJSON(text) || text;
    } catch (error: any) {
      console.error('Error in analyzeLibraryData:', error);
      throw error;
    }
  }

  // H. Damage Detection from Image Description
  async detectDamage(imageDescription: string, bookCondition: string) {
    const model = this.getModel('FLASH');
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
    
    return this.extractJSON(text) || text;
  }

  // I. Fine Calculation (Logic-based + Policy)
  async calculateFine(overdueDays: number, bookValue: number, bookCondition: string, userHistory: string, finePerDay: number = 5) {
    const model = this.getModel('FLASH');
    const prompt = `Calculate a fair library fine:
- Overdue days: ${overdueDays}
- Base fine rate: ₹${finePerDay} per day
- Book value: ₹${bookValue}
- Reported damage: ${bookCondition}
- User's return history: ${userHistory}

Policy:
1. Overdue fine: overdueDays * finePerDay
2. Damage fee: 10-50% of book value depending on severity
3. History: Apply 20% discount for frequent timely returners or 20% surcharge for repeat offenders.

Return JSON:
- baseFine: number
- damageFee: number
- totalFine: number
- reasoning: brief explanation`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    return this.extractJSON(text) || text;
  }

  // J. AI Cataloging - Auto-generate metadata
  async generateCatalogData(bookInfo: { title: string; author: string; description?: string; isbn?: string }) {
    const model = this.getModel('FLASH');
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
    
    return this.extractJSON(text) || text;
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
    const model = this.getModel('FLASH');
    const prompt = `
      Generate a ${reportType} library report for the period: ${period}

      ### 📊 DATA:
      ${JSON.stringify(data, null, 2)}

      ### 🧱 STRUCTURE:
      1. Executive summary
      2. Key metrics and statistics
      3. Notable trends or patterns
      4. Recommendations

      ### 🏠 RULES:
      1. Return a JSON object with a single key "reportSummary" containing the full markdown report.
      2. Use professional formatting with headers, tables, and lists.

      ### 📝 OUTPUT FORMAT:
      {
        "reportSummary": "full markdown report..."
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return this.extractJSON(text) || { reportSummary: text };
    } catch (error: any) {
      console.error('Error in generateReport:', error);
      throw error;
    }
  }

  // M. Shelf Management - Organization suggestions
  async suggestShelfOrganization(books: any[], constraints: any) {
    const model = this.getModel('FLASH');
    const prompt = `Suggest shelf organization for these books:
      Books: ${JSON.stringify(books)}
      Constraints: ${JSON.stringify(constraints)}

      Return JSON with:
      - "sections": Array of shelf sections (name, range)
      - "rationale": Brief explanation
      - "recommendations": Top 3 optimizations
      - "relocations": Array of { book, from, to, reason }
      
      Keep the response concise and strictly JSON. Do not include book details other than titles.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return this.extractJSON(text) || { relocations: [], rationale: text };
    } catch (error: any) {
      console.error('Error in suggestShelfOrganization:', error);
      throw error;
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

  // N2. Suggest New Reading Goals
  async suggestReadingGoals(studentData: any) {
    const model = this.getModel('FLASH');
    const prompt = `Based on this student's reading history and performance, suggest 3 highly personalized, SMART reading goals for the next month.
    
    ### 📊 STUDENT DATA:
    ${JSON.stringify(studentData, null, 2)}

    ### 🏠 RULES:
    1. **Personalization**: If they read many books, suggest a challenge. If they are slow, suggest consistency.
    2. **Variety**: Suggest goals for volume, diversity (genres), and consistency (streaks).
    3. **Format**: Return ONLY a JSON array of 3 objects.

    ### 📝 OUTPUT FORMAT (JSON ONLY):
    [
      {
        "title": "Short catchy goal title",
        "description": "Brief explanation of why this fits them",
        "target": number (total books to read),
        "category": "Specific category or 'General'",
        "difficulty": "Beginner" | "Intermediate" | "Expert"
      }
    ]

    Return ONLY the JSON array.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return this.extractJSON(text) || [];
    } catch (error: any) {
      console.error('Error in suggestReadingGoals:', error);
      throw error;
    }
  }

  // O. Reading Stats Analysis
  async analyzeReadingStats(stats: any) {
    const model = this.getModel('FLASH');
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
    
    return this.extractJSON(text) || text;
  }

  // P. Student Analytics - Performance insights
  async analyzeStudentPerformance(studentData: any, classData?: any) {
    const model = this.getModel('FLASH');
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
    
    return this.extractJSON(text) || text;
  }

  // R. Bulk Import Processing
  async processBulkImport(booksData: string, format: 'csv' | 'json' | 'text') {
    const model = this.getModel('FLASH');
    const prompt = `Process bulk book import data in ${format} format:
${booksData}

Extract and return ONLY a JSON array of objects. Each object must have:
- title (required)
- author (required)
- isbn (if available)
- genre (if available)
- description (if available)
- status: 'valid' | 'needs_review' | 'incomplete'
- issues: array of strings describing any problems with this entry (e.g., ["Missing ISBN", "Unknown author"])

Example output:
[
  { "title": "Example", "author": "John Doe", "status": "valid", "issues": [] }
]`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = this.extractJSON(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error: any) {
      console.error('Error in processBulkImport:', error);
      throw error;
    }
  }

  // S. Multi-modal: Analyze image (for damage detection, cover recognition)
  async analyzeImage(imageBase64: string, mimeType: string, promptText: string) {
    const model = this.getModel('FLASH');
    
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
    const model = this.getModel('FLASH');
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
    try {
      // 1. Extract text from PDF using the pdf-parse library
      const data = await pdf(buffer);
      const text = data.text;
      
      // 2. Truncate if too long (Gemini limits vary, but 30k chars is a safe buffer for Flash/Pro)
      const truncatedText = text.slice(0, 30000);

      const prompt = `
        Perform a deep semantic analysis and summarize the document titled "${originalName}".
        
        ### 🎨 STYLE & STRUCTURE (MANDATORY):
        - Output strictly in **Premium Markdown** format.
        - Use H2 (##) for main chapters and H3 (###) for sub-topics.
        - Use **Bold** for critical concepts and *Italic* for contextual nuances.
        - Use **Structured Tables** for data, comparisons, or definitions.
        - Use **Blockquotes (>)** for major insights or summary "Nuggets".
        - Use **Bullet points** with clear hierarchy.
        - Incorporate relevant emojis (📊, ✅, 🎓, 📎) for visual mapping.
        - Add a horizontal rule (---) between major segments.

        ### 🧱 REQUIRED SECTIONS:
        1. **Abstract Insight**: A 4-sentence high-level overview.
        2. **Concept Hierarchy Table**: A table mapping Terms to Definitions.
        3. **Technical Deep Dive**: Logic-based breakdown of the primary chapters.
        4. **Actionable Strategy**: How to apply this knowledge immediately. 
        5. **Mastery Check**: 3 challenging questions to test deep understanding.

        ### 📄 DOCUMENT CONTENT:
        ${truncatedText}
      `;

      const model = this.getModel('PRO');
      const resultAI = await model.generateContent(prompt);
      const textResponse = resultAI.response.text();
      
      // Clean up markdown code block wrappers if present
      return textResponse.replace(/^```markdown\n/, '').replace(/```$/, '').trim();
    } catch (error) {
      console.error('Error parsing PDF or generating summary:', error);
      throw new Error('Failed to process PDF summary');
    }
  }

  // Helper for consistent JSON extraction from AI responses
  private extractJSON(text: string) {
    try {
      // 1. Pre-clean the text for potentially malformed JSON
      let cleaned = text.trim();
      
      // Remove markdown wrappers if present
      cleaned = cleaned.replace(/^```json\n?|```$/g, '').trim();

      // Find the main JSON structure (first { or [ until the last } or ])
      const startObj = cleaned.indexOf('{');
      const startArr = cleaned.indexOf('[');
      const start = (startObj !== -1 && (startArr === -1 || startObj < startArr)) ? startObj : startArr;
      
      const endObj = cleaned.lastIndexOf('}');
      const endArr = cleaned.lastIndexOf(']');
      const end = (endObj !== -1 && (endArr === -1 || endObj > endArr)) ? endObj : endArr;

      if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.substring(start, end + 1);
      }

      // Handle common AI mistakes: trailing commas before closing braces/brackets
      cleaned = cleaned.replace(/,\s*([\}\]])/g, '$1');

      try {
        return JSON.parse(cleaned);
      } catch (parseError: any) {
        // Final attempt: if it's truncated, try to close it (basic fix)
        if (parseError.message.includes('Unexpected end of JSON input')) {
          if (cleaned.startsWith('{') && !cleaned.endsWith('}')) cleaned += '}';
          if (cleaned.startsWith('[') && !cleaned.endsWith(']')) cleaned += ']';
          return JSON.parse(cleaned);
        }
        throw parseError;
      }
    } catch (e) {
      console.error('Extract JSON Error:', e);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
export default geminiService;
