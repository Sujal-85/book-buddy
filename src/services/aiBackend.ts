import axios from 'axios';

const API_URL = import.meta.env.VITE_AI_BACKEND_URL;

const aiApi = axios.create({
  baseURL: API_URL,
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
  relocations?: Array<{ book: string; from: string; to: string; reason: string }>;
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
export const summarizeText = async (text: string, maxLength: number = 500, context?: any) => {
  const response = await aiApi.post('/ai/summarize', { text, maxLength, context });
  return response.data.summary;
};

// B2. PDF Summarization Service
export const summarizePDF = async (file: File, context?: any) => {
  const formData = new FormData();
  formData.append('pdf', file);
  if (context) {
    formData.append('context', JSON.stringify(context));
  }
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
  libraryBooks: any[] = [],
  studentHistory: any[] = [],
  context?: any
): Promise<BookRecommendation[]> => {
  const response = await aiApi.post('/ai/recommendations', { 
    preferences, 
    genres, 
    count, 
    libraryBooks,
    studentHistory,
    context
  });
  return response.data.recommendations;
};

// D. Voice Query Processing
export const processVoiceQuery = async (transcript: string, context?: any): Promise<VoiceQueryResult> => {
  const response = await aiApi.post('/ai/voice-query', { transcript, context });
  return response.data.result;
};

// E. Study Companion
export const askStudyCompanion = async (question: string, context?: any) => {
  const response = await aiApi.post('/ai/study', { 
    question, 
    userProfile: context?.userProfile,
    libraryBooks: context?.libraryBooks,
    history: context?.history,
    fileData: context?.fileData,
    context // Pass the original context for logging
  });
  return response.data.response;
};

// F. Review Analysis
export const analyzeReviews = async (reviews: string[], context?: any): Promise<ReviewAnalysis> => {
  const response = await aiApi.post('/ai/analyze-reviews', { reviews, context });
  return response.data.analysis;
};

// G. Library Analytics
export const analyzeLibraryData = async (data: any, analysisType: string, context?: any) => {
  const response = await aiApi.post('/ai/analytics', { data, analysisType, context });
  return response.data.insights;
};

// H. Damage Detection
export const detectDamage = async (
  imageDescription: string,
  bookCondition: string,
  context?: any
): Promise<DamageAssessment> => {
  const response = await aiApi.post('/ai/damage-detection', { imageDescription, bookCondition, context });
  return response.data.assessment;
};

// I. Fine Calculation
export const calculateFine = async (
  overdueDays: number,
  bookValue: number,
  bookCondition: string,
  userHistory: string,
  finePerDay: number = 5,
  context?: any
): Promise<FineCalculation> => {
  const response = await aiApi.post('/ai/calculate-fine', {
    overdueDays,
    bookValue,
    bookCondition,
    userHistory,
    finePerDay,
    context
  });
  return response.data.fine;
};

// J. AI Cataloging
export const catalogBook = async (bookInfo: {
  title: string;
  author: string;
  description?: string;
  isbn?: string;
}, context?: any): Promise<CatalogData> => {
  const response = await aiApi.post('/ai/catalog', { bookInfo, context });
  return response.data.catalogData;
};

export const generateCatalogData = catalogBook;

// K. Smart Notifications
export const generateNotification = async (
  type: string,
  userData: any,
  context?: any
) => {
  const response = await aiApi.post('/ai/notification', { type, userData, context });
  return response.data;
};

export const sendTargetedNotification = generateNotification;

// L. AI Reports
export const generateReport = async (reportType: string, data: any, period: string, context?: any) => {
  const response = await aiApi.post('/ai/report', { reportType, data, period, context });
  return response.data.report;
};

// M. Shelf Organization
export const suggestShelfOrganization = async (
  books: any[] | string,
  constraints?: any,
  context?: any
): Promise<ShelfOrganization> => {
  const response = await aiApi.post('/ai/shelf-organization', { books, constraints, context });
  return response.data.organization;
};

export const organizeShelves = suggestShelfOrganization;

// N. Reading Goals
export const getReadingGoalAssistance = async (
  currentProgress: number,
  goal: number,
  timeframe: string,
  readingSpeed?: string,
  context?: any
) => {
  const response = await aiApi.post('/ai/reading-goal', {
    currentProgress,
    goal,
    timeframe,
    readingSpeed,
    context
  });
  return response.data.assistance;
};

// N2. Suggest New Reading Goals
export const suggestReadingGoals = async (studentData: any, context?: any) => {
  const response = await aiApi.post('/ai/suggest-goals', { studentData, context });
  return response.data.suggestions;
};

// O. Reading Stats Analysis
export const analyzeReadingStats = async (stats: any, context?: any): Promise<ReadingStatsAnalysis> => {
  const response = await aiApi.post('/ai/reading-stats', { stats, context });
  return response.data.analysis;
};

// P. Student Analytics
export const analyzeStudentPerformance = async (studentData: any, classData?: any, context?: any) => {
  const response = await aiApi.post('/ai/student-analytics', { studentData, classData, context });
  return response.data.analysis;
};

export const analyzeStudentGoals = analyzeStudentPerformance;

// Q. Availability Prediction
export const predictAvailability = async (
  bookData: any,
  queueLength: number = 0,
  context?: any
): Promise<any> => {
  const response = await aiApi.post('/ai/predict-availability', { bookData, queueLength, context });
  return response.data.prediction;
};

// R. Bulk Import
export const processBulkImport = async (
  data: string,
  format: 'csv' | 'json' | 'text' = 'text',
  context?: any
): Promise<BulkImportResult[]> => {
  const response = await aiApi.post('/ai/bulk-import', { data, format, context });
  return response.data.processed;
};

export const bulkImport = processBulkImport;

// S. Image Analysis
export const analyzeImage = async (imageBase64: string, mimeType: string, prompt: string, context?: any) => {
  const response = await aiApi.post('/ai/analyze-image', { imageBase64, mimeType, prompt, context });
  return response.data.analysis;
};

// T. General Text Generation
export const generateText = async (
  prompt: string,
  temperature: number = 0.7,
  maxTokens: number = 2048,
  context?: any
) => {
  const response = await aiApi.post('/ai/generate', { prompt, temperature, maxTokens, context });
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

// V. Audit Logs
export const getAILogs = async (limit: number = 50) => {
  const response = await aiApi.get(`/ai/logs?limit=${limit}`);
  return response.data.logs;
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
  catalogBook,
  generateCatalogData,
  processBulkImport,
  bulkImport,
  // Search
  processVoiceQuery,
  // Study
  askStudyCompanion,
  // Reviews
  analyzeReviews,
  // Analytics
  analyzeLibraryData,
  analyzeStudentPerformance,
  analyzeStudentGoals,
  analyzeReadingStats,
  // Admin
  detectDamage,
  calculateFine,
  suggestShelfOrganization,
  organizeShelves,
  // Notifications
  sendTargetedNotification,
  generateNotification,
  generateReport,
  // Students
  getReadingGoalAssistance,
  predictAvailability,
  // Image
  analyzeImage,
  // Health
  checkAIBackendHealth,
  // Audit
  getAILogs,
};
