import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:3001/api';

const aiApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // AI requests may take longer
});

// Error handling interceptor
aiApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('AI API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data?.error || error.message);
  }
);

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export interface BookRecommendation {
  title: string;
  author: string;
  description: string;
  matchReason: string;
}

export interface VoiceQueryResult {
  searchTerms: string;
  bookTitle: string | null;
  author: string | null;
  genre: string | null;
  intent: 'search' | 'borrow' | 'return' | 'info' | 'recommendation';
  confidence: number;
}

export interface ReviewAnalysis {
  overallSentiment: 'positive' | 'negative' | 'mixed';
  sentimentScore: number;
  keyThemes: string[];
  commonPraises: string[];
  commonComplaints: string[];
  briefSummary: string;
}

export interface DamageAssessment {
  damageLevel: 'none' | 'minor' | 'moderate' | 'severe';
  damageTypes: string[];
  repairable: boolean;
  recommendedFine: number;
  notes: string;
}

export interface FineCalculation {
  baseFine: number;
  damageFee: number;
  totalFine: number;
  reasoning: string;
}

export interface CatalogData {
  subjects: string[];
  keywords: string[];
  targetAudience: 'children' | 'young adult' | 'adult' | 'all ages';
  genre: string;
  suggestedShelfLocation: string;
  summary: string;
}

export interface ShelfOrganization {
  sections: Array<{ name: string; bookRanges: string[] }>;
  rationale: string;
  spaceUtilization: number;
  recommendations: string[];
}

export interface ReadingStatsAnalysis {
  readingPersona: string;
  strengths: string[];
  suggestions: string[];
  genreDiversity: number;
  monthlyGoals: number[];
}

export interface AvailabilityPrediction {
  estimatedDaysUntilAvailable: number;
  confidence: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface BulkImportResult {
  title: string;
  author: string;
  isbn?: string;
  genre?: string;
  description?: string;
  status: 'valid' | 'needs_review' | 'incomplete';
  issues?: string[];
}

// A. Chat Service
export const chatWithAI = async (message: string, history: ChatMessage[] = []) => {
  const response = await aiApi.post('/ai/chat', { message, history });
  return response.data.response;
};

// B. Summarization Service
export const summarizeText = async (text: string, maxLength: number = 500) => {
  const response = await aiApi.post('/ai/summarize', { text, maxLength });
  return response.data.summary;
};

// B2. PDF Summarization Service
export const summarizePDF = async (file: File) => {
  const formData = new FormData();
  formData.append('pdf', file);
  const response = await aiApi.post('/ai/summarize-pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.summary;
};

// C. Book Recommendations
export const getBookRecommendations = async (
  preferences: string,
  genres: string[] = [],
  count: number = 5,
  libraryBooks: any[] = []
): Promise<BookRecommendation[]> => {
  const response = await aiApi.post('/ai/recommendations', { preferences, genres, count, libraryBooks });
  return response.data.recommendations;
};

// D. Voice Query Processing
export const processVoiceQuery = async (transcript: string): Promise<VoiceQueryResult> => {
  const response = await aiApi.post('/ai/voice-query', { transcript });
  return response.data.result;
};

// E. Study Companion
export const askStudyCompanion = async (question: string, context?: any) => {
  const response = await aiApi.post('/ai/study', { 
    question, 
    userProfile: context?.userProfile,
    libraryBooks: context?.libraryBooks,
    fileData: context?.fileData
  });
  return response.data.response;
};

// F. Review Analysis
export const analyzeReviews = async (reviews: string[]): Promise<ReviewAnalysis> => {
  const response = await aiApi.post('/ai/analyze-reviews', { reviews });
  return response.data.analysis;
};

// G. Library Analytics
export const analyzeLibraryData = async (data: any, analysisType: string) => {
  const response = await aiApi.post('/ai/analytics', { data, analysisType });
  return response.data.insights;
};

// H. Damage Detection
export const detectDamage = async (
  imageDescription: string,
  bookCondition: string
): Promise<DamageAssessment> => {
  const response = await aiApi.post('/ai/damage-detection', { imageDescription, bookCondition });
  return response.data.assessment;
};

// I. Fine Calculation
export const calculateFine = async (
  overdueDays: number,
  bookValue: number,
  bookCondition: string,
  userHistory: string
): Promise<FineCalculation> => {
  const response = await aiApi.post('/ai/calculate-fine', {
    overdueDays,
    bookValue,
    bookCondition,
    userHistory,
  });
  return response.data.fine;
};

// J. AI Cataloging
export const generateCatalogData = async (bookInfo: {
  title: string;
  author: string;
  description?: string;
  isbn?: string;
}): Promise<CatalogData> => {
  const response = await aiApi.post('/ai/catalog', { bookInfo });
  return response.data.catalogData;
};

// K. Smart Notifications
export const generateNotification = async (
  type: string,
  userData: any,
  context?: any
) => {
  const response = await aiApi.post('/ai/notification', { type, userData, context });
  return response.data.message;
};

// L. AI Reports
export const generateReport = async (reportType: string, data: any, period: string) => {
  const response = await aiApi.post('/ai/report', { reportType, data, period });
  return response.data.report;
};

// M. Shelf Organization
export const suggestShelfOrganization = async (
  books: any[],
  constraints?: any
): Promise<ShelfOrganization> => {
  const response = await aiApi.post('/ai/shelf-organization', { books, constraints });
  return response.data.organization;
};

// N. Reading Goals
export const getReadingGoalAssistance = async (
  currentProgress: number,
  goal: number,
  timeframe: string,
  readingSpeed?: string
) => {
  const response = await aiApi.post('/ai/reading-goal', {
    currentProgress,
    goal,
    timeframe,
    readingSpeed,
  });
  return response.data.assistance;
};

// O. Reading Stats Analysis
export const analyzeReadingStats = async (stats: any): Promise<ReadingStatsAnalysis> => {
  const response = await aiApi.post('/ai/reading-stats', { stats });
  return response.data.analysis;
};

// P. Student Analytics
export const analyzeStudentPerformance = async (studentData: any, classData?: any) => {
  const response = await aiApi.post('/ai/student-analytics', { studentData, classData });
  return response.data.analysis;
};

// Q. Availability Prediction
export const predictAvailability = async (
  bookData: any,
  queueLength: number
): Promise<AvailabilityPrediction> => {
  const response = await aiApi.post('/ai/predict-availability', { bookData, queueLength });
  return response.data.prediction;
};

// R. Bulk Import
export const processBulkImport = async (
  data: string,
  format: 'csv' | 'json' | 'text' = 'text'
): Promise<BulkImportResult[]> => {
  const response = await aiApi.post('/ai/bulk-import', { data, format });
  return response.data.processed;
};

// S. Image Analysis
export const analyzeImage = async (imageBase64: string, mimeType: string, prompt: string) => {
  const response = await aiApi.post('/ai/analyze-image', { imageBase64, mimeType, prompt });
  return response.data.analysis;
};

// T. General Text Generation
export const generateText = async (
  prompt: string,
  temperature: number = 0.7,
  maxTokens: number = 2048
) => {
  const response = await aiApi.post('/ai/generate', { prompt, temperature, maxTokens });
  return response.data.generated;
};

// Health check
export const checkAIBackendHealth = async () => {
  try {
    const response = await aiApi.get('/health');
    return response.data.status === 'ok';
  } catch {
    return false;
  }
};

export default {
  // Chat
  chatWithAI,
  // Content
  summarizeText,
  summarizePDF,
  generateText,
  // Books
  getBookRecommendations,
  generateCatalogData,
  processBulkImport,
  // Search
  processVoiceQuery,
  // Study
  askStudyCompanion,
  // Reviews
  analyzeReviews,
  // Analytics
  analyzeLibraryData,
  analyzeStudentPerformance,
  analyzeReadingStats,
  // Admin
  detectDamage,
  calculateFine,
  suggestShelfOrganization,
  // Notifications
  generateNotification,
  generateReport,
  // Students
  getReadingGoalAssistance,
  predictAvailability,
  // Image
  analyzeImage,
  // Health
  checkAIBackendHealth,
};
