import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { isMockMode } from './config/firebase.js';
import { isMockAI } from './config/gemini.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString().split('T')[1].substring(0, 8)}] ${req.method} ${req.url}`);
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      console.error(`  ❌ Response: ${res.statusCode}`);
    } else {
      console.log(`  ✅ Response: ${res.statusCode}`);
    }
  });
  next();
});

// Helmet for security headers
app.use(helmet());

// CORS configuration - allowing local frontend dev server and production domains
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = corsOrigin.split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Express body parsers (limit set to 10MB to accommodate receipt base64 uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting to protect against brute force / denial of service
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 mins
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200, // Limit each IP to 200 requests per window
  message: { success: false, error: 'Too many requests from this IP. Please try again after 15 minutes.' }
});
app.use('/api', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mockDatabase: isMockMode,
    mockAI: isMockAI
  });
});

// Register all API routes
app.use('/api', router);

// Register global error handler middleware (must be registered last)
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`🌿 EcoTrack AI Backend running on http://localhost:${PORT}`);
  console.log(`📂 DB Mode: ${isMockMode ? 'MOCK (In-Memory)' : 'PRODUCTION (Firestore)'}`);
  console.log(`🧠 AI Mode: ${isMockAI ? 'MOCK (Hardcoded JSON)' : 'PRODUCTION (Gemini API)'}`);
});

export default app;
