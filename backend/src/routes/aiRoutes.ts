import express from 'express';
import multer from 'multer';
import { geminiService } from '../services/geminiService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/summarize-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    const summary = await geminiService.summarizePDF(req.file.buffer, req.file.originalname);
    res.json({ success: true, summary });
  } catch (err: any) {
    console.error('Error in /summarize-pdf:', err);
    res.status(500).json({ error: err.message || 'Failed to summarize PDF' });
  }
});

router.post('/summarize', async (req, res) => {
  try {
    const { text, maxLength } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const summary = await geminiService.summarize(text, maxLength || 1000);
    res.json({ success: true, summary });
  } catch (err: any) {
    console.error('Error in /summarize:', err);
    res.status(500).json({ error: err.message || 'Failed to summarize text' });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const response = await geminiService.chat(message, history || []);
    res.json({ success: true, response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recommendations', async (req, res) => {
  try {
    const { preferences, genres, count, libraryBooks } = req.body;
    const recommendations = await geminiService.getBookRecommendations(preferences, genres, count, libraryBooks);
    res.json({ success: true, recommendations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/voice-query', async (req, res) => {
  try {
    const { transcript } = req.body;
    const result = await geminiService.processVoiceQuery(transcript);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/study', async (req, res) => {
  try {
    const { question, userProfile, libraryBooks, fileData } = req.body;
    const response = await geminiService.studyCompanion(question, { userProfile, libraryBooks, fileData });
    res.json({ success: true, response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/analyze-reviews', async (req, res) => {
  try {
    const { reviews } = req.body;
    const analysis = await geminiService.analyzeReviews(reviews);
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reading-stats', async (req, res) => {
  try {
    const { stats } = req.body;
    const analysis = await geminiService.analyzeReadingStats(stats);
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
