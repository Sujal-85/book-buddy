import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { onRequest } from 'firebase-functions/v2/https';
import aiRoutes from './routes/aiRoutes.js';
import borrowRoutes from './routes/borrowRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
const baseRouter = express.Router();

baseRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'firebase' });
});

// Routes
baseRouter.use('/ai', aiRoutes);
baseRouter.use('/borrows', borrowRoutes);
baseRouter.use('/notifications', notificationRoutes);

// Use the base router with '/api' prefix for local dev, or directly for cloud
app.use('/api', baseRouter);
app.use('/', baseRouter); // Fallback for Firebase where /api is stripped

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Export the app as a Firebase Function
export const api = onRequest({
  memory: "256MiB",
  timeoutSeconds: 60,
  cors: true,
  maxInstances: 10,
  secrets: ["GEMINI_API_KEY"]
}, async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ WARNING: GEMINI_API_KEY not found in process.env at runtime.');
  }
  return app(req, res);
});

// For local development
if (process.env.NODE_ENV !== 'production' && !process.env.FUNCTIONS_EMULATOR && !process.env.FIREBASE_CONFIG) {
  app.listen(PORT, () => {
    console.log(`🚀 AI Backend Server running on port ${PORT}`);
    console.log(`📚 Gemini AI Features Ready!`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
} else {
  console.log(`⚙️ Running in ${process.env.NODE_ENV || 'cloud'} mode - API listener deferred to platform.`);
}

export default app;
