// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ====================== MIDDLEWARES GLOBAIS ======================
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ====================== ROTAS ======================
app.get('/', (req, res) => {
  res.json({ message: 'API MS-LAB funcionando com PostgreSQL!' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/operadores', require('./routes/operadores'));
app.use('/api/objetos', require('./routes/objetos'));
app.use('/api/logs', require('./routes/logs'));

// ====================== 404 ======================
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ====================== START ======================
app.listen(port, () => {
  console.log(`🚀 Servidor MS-LAB rodando em http://localhost:${port}`);
});