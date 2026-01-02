const express = require('express');
const { validateEnvironment } = require('./utils/validateEnv');
const routes = require('./routes/loader');

// Validate environment variables before starting the server
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(routes);

app.get('/', (req, res) => {
  res.send('Server is running.');
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
