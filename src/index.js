const express = require('express');
const app = express();
`const PORT = process.env.PORT|| 8080;

app.use(express.json());

app.post('/notion', (req, res) => {
  console.log('Received Notion request with body', req.body);
  res.status(200).send({ message: 'Notion route hit!' });
});

app.post('/gpt', (req, res) => {
  console.log('Received GPT request with body', req.body);
  res.status(200).send({ message: 'GPT route hit!' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});