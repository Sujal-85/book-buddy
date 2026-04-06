import express from 'express';
import multer from 'multer';
import { geminiService } from '../services/geminiService.js';
import { db } from '../services/firebaseAdmin.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to log AI results to Firestore
const saveAIResult = async (type: string, input: any, output: any, context?: any) => {
  try {
    await db.collection('ai_logs').add({
      type: type,
      subType: context?.subType || 'general',
      prompt: context?.prompt || JSON.stringify(input),
      result: output,
      userId: context?.userId || 'system',
      userEmail: context?.userEmail || 'system-admin',
      model: context?.model || 'Gemini 1.5 Flash',
      timestamp: new Date(),
      status: 'success'
    });
  } catch (err) {
    console.error(`Failed to log AI result for ${type}:`, err);
  }
};

// GET all AI logs for audit
router.get('/logs', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const snapshot = await db.collection('ai_logs')
      .orderBy('timestamp', 'desc')
      .limit(Number(limit))
      .get();
    
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }));
    
    res.json({ success: true, logs });
  } catch (err: any) {
    console.error('Error fetching AI logs:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch AI logs' });
  }
});

router.post('/summarize-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    const summary = await geminiService.summarizePDF(req.file.buffer, req.file.originalname);
    saveAIResult('summarization', { filename: req.file.originalname }, summary, { 
      subType: 'pdf', 
      prompt: `Summarize PDF: ${req.file.originalname}`,
      ...req.body.context 
    });
    res.json({ success: true, summary });
  } catch (err: any) {
    console.error('Error in /summarize-pdf:', err);
    res.status(500).json({ error: err.message || 'Failed to summarize PDF' });
  }
});

router.post('/catalog', async (req, res) => {
  try {
    const { bookInfo, context } = req.body;
    const catalogData = await geminiService.generateCatalogData(bookInfo);
    saveAIResult('cataloging', bookInfo, catalogData, { 
      subType: 'semantic_scan', 
      prompt: `Catalog: ${bookInfo.title}`,
      ...context 
    });
    res.json({ success: true, catalogData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/analytics', async (req, res) => {
  try {
    const { data, analysisType, context } = req.body;
    const insights = await geminiService.analyzeLibraryData(data, analysisType);
    await saveAIResult('analytics', { analysisType }, insights, { 
      subType: analysisType, 
      prompt: `Run ${analysisType} analysis`,
      ...context 
    });
    res.json({ success: true, insights });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/damage-detection', async (req, res) => {
  try {
    const { imageDescription, bookCondition, context } = req.body;
    const assessment = await geminiService.detectDamage(imageDescription, bookCondition);
    saveAIResult('damage_detection', { bookCondition }, assessment, { 
      subType: 'condition_check', 
      prompt: `Assess damage: ${imageDescription}`,
      ...context 
    });
    res.json({ success: true, assessment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/calculate-fine', async (req, res) => {
  try {
    const { overdueDays, bookValue, bookCondition, userHistory, finePerDay, context } = req.body;
    const fine = await geminiService.calculateFine(overdueDays, bookValue, bookCondition, userHistory, finePerDay);
    saveAIResult('fine_calculator', { overdueDays, bookCondition }, fine, { 
      subType: 'late_return', 
      prompt: `Calculate fine for ${overdueDays} days late at ₹${finePerDay}/day`,
      ...context 
    });
    res.json({ success: true, fine });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bulk-import', async (req, res) => {
  try {
    const { data, format, context } = req.body;
    const processed = await geminiService.processBulkImport(data, format);
    saveAIResult('bulk_import', { format, dataLength: data.length }, processed, { 
      subType: format, 
      prompt: `Bulk import ${format} data`,
      ...context 
    });
    res.json({ success: true, processed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/student-analytics', async (req, res) => {
  try {
    const { studentData, classData, context } = req.body;
    const analysis = await geminiService.analyzeStudentPerformance(studentData, classData);
    await saveAIResult('analytics', { studentId: studentData.id }, analysis, { 
      subType: 'student_profiling', 
      prompt: `Profile student: ${studentData.id}`,
      ...context 
    });
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/report', async (req, res) => {
  try {
    const { reportType, data, period, context } = req.body;
    const report = await geminiService.generateReport(reportType, data, period);
    await saveAIResult('reports', { reportType, period }, report, { 
      subType: reportType, 
      prompt: `Generate ${reportType} report for ${period}`,
      ...context 
    });
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shelf-organization', async (req, res) => {
  try {
    const { books, constraints, context } = req.body;
    const organization = await geminiService.suggestShelfOrganization(books, constraints);
    await saveAIResult('shelf_management', { bookCount: books.length }, organization, { 
      subType: 'optimization', 
      prompt: `Optimize shelf organization for ${books.length} books`,
      ...context 
    });
    res.json({ success: true, organization });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reading-goal', async (req, res) => {
  try {
    const { currentProgress, goal, timeframe, readingSpeed, context } = req.body;
    const assistance = await geminiService.assistReadingGoal(currentProgress, goal, timeframe, readingSpeed);
    await saveAIResult('student_assistance', { goal, timeframe }, assistance, { 
      subType: 'reading_goal', 
      prompt: `Goal: ${goal} in ${timeframe}`,
      ...context 
    });
    res.json({ success: true, assistance });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/suggest-goals', async (req, res) => {
  try {
    const { studentData, context } = req.body;
    const suggestions = await geminiService.suggestReadingGoals(studentData);
    await saveAIResult('student_assistance', { studentId: studentData.id }, suggestions, { 
      subType: 'goal_suggestions', 
      prompt: `Suggest goals for student ${studentData.id}`,
      ...context 
    });
    res.json({ success: true, suggestions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/predict-availability', async (req, res) => {
  try {
    const { bookData, queueLength, context } = req.body;
    const prediction = await geminiService.predictAvailability(bookData, queueLength);
    await saveAIResult('predictions', { bookId: bookData.id, queueLength }, prediction, { 
      subType: 'availability', 
      prompt: `Predict availability for ${bookData.title}`,
      ...context 
    });
    res.json({ success: true, prediction });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notification', async (req, res) => {
  try {
    const { type, userData, context } = req.body;
    const message = await geminiService.generateNotification(type, userData, context);
    await saveAIResult('notifications', { type, userId: userData?.id }, message, { 
      subType: type, 
      prompt: `Generate ${type} notification`,
      ...context 
    });
    res.json({ success: true, message });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType, prompt, context } = req.body;
    const analysis = await geminiService.analyzeImage(imageBase64, mimeType, prompt);
    await saveAIResult('analyze-image', { prompt }, analysis, context);
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { prompt, temperature, maxTokens, context } = req.body;
    const generated = await geminiService.generateText(prompt, temperature, maxTokens);
    await saveAIResult('generate', { prompt }, generated, context);
    res.json({ success: true, generated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/summarize', async (req, res) => {
  try {
    const { text, maxLength, context } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const summary = await geminiService.summarize(text, maxLength || 1000);
    await saveAIResult('summarize', { textLength: text.length }, summary, context);
    res.json({ success: true, summary });
  } catch (err: any) {
    console.error('Error in /summarize:', err);
    res.status(500).json({ error: err.message || 'Failed to summarize text' });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { message, history, context } = req.body;
    const response = await geminiService.chat(message, history || []);
    await saveAIResult('chat', { message, historyLength: history?.length }, response, context);
    res.json({ success: true, response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recommendations', async (req, res) => {
  try {
    const { preferences, genres, count, libraryBooks, studentHistory, context } = req.body;
    const recommendations = await geminiService.getBookRecommendations(preferences, genres, count, libraryBooks, studentHistory);
    await saveAIResult('recommendations', { preferences, genres }, recommendations, context);
    res.json({ success: true, recommendations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/voice-query', async (req, res) => {
  try {
    const { transcript, context } = req.body;
    const result = await geminiService.processVoiceQuery(transcript);
    await saveAIResult('voice-query', { transcript }, result, context);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/study', async (req, res) => {
  try {
    const { question, userProfile, libraryBooks, history, fileData, context } = req.body;
    const response = await geminiService.studyCompanion(question, { userProfile, libraryBooks, history, fileData });
    await saveAIResult('study', { question }, response, context);
    res.json({ success: true, response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/analyze-reviews', async (req, res) => {
  try {
    const { reviews, context } = req.body;
    const analysis = await geminiService.analyzeReviews(reviews);
    await saveAIResult('analyze-reviews', { reviewCount: reviews.length }, analysis, context);
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reading-stats', async (req, res) => {
  try {
    const { stats, context } = req.body;
    const analysis = await geminiService.analyzeReadingStats(stats);
    await saveAIResult('reading-stats', { userId: stats.userId }, analysis, context);
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
