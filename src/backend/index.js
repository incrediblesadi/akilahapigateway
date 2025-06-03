/**
 * Backend API Gateway Entry Point
 * 
 * This file serves as the main entry point for the backend API gateway service.
 * It will be deployed to Cloud Run when changes are pushed to the main branch
 * and affect files in this directory or the deploy.yml workflow file itself.
 */

// Import required modules
const express = require('express');
const app = express();

// Configure middleware
app.use(express.json());

// Define routes
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API Gateway is running',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // Export for testing