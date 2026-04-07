import express from 'express';
import cors from 'cors';
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
  res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'cloud-run' });
});

// Routes
baseRouter.use('/ai', aiRoutes);
baseRouter.use('/borrows', borrowRoutes);
baseRouter.use('/notifications', notificationRoutes);

// Always use the base router directly for Cloud Run/Container
app.use('/', baseRouter);
app.use('/api', baseRouter); // Keep /api prefix support for backward compatibility

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

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 AI Backend Server running on port ${PORT}`);
  console.log(`📚 Gemini AI Features Ready!`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
});

export default app;
