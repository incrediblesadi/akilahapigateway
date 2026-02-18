 const express = require('express');
const routes = require('./routes/loader');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

<<<<<<< HEAD
// Health check endpoint (before other routes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'akilah-api-gateway'
  });
});

=======
// Health check endpoint (before other routes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'akilah-api-gateway'
  });
});

>>>>>>> 54055ac33b42950c0dc9332c1d0d2eb606e334d3
app.get('/', (req, res) => {
  res.send('Server is running.');
});

app.use(routes);

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
