require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8080;

app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'script-src': ["'self'", "'unsafe-inline'", 'https://accounts.google.com'],
      'style-src': ["'self'", 'https:', "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https://accounts.google.com'],
      'frame-src': ["'self'", 'https://accounts.google.com']
    }
  }
}));
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(','),
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100
});
app.use(limiter);

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Load routes
app.use(require('./routes/loader'));

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
