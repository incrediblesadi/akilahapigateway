 const express = require('express');
const routes = require('./routes/loader');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Health check endpoint (before other routes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'akilah-api-gateway'
  });
});

app.get('/', (req, res) => {
  res.send('Server is running.');
});

app.use(routes);

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
