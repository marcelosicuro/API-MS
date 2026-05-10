// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ====================== MIDDLEWARES ======================
app.use(helmet());
app.use(cors());
app.use(express.json());

// Log de requisições (útil para debug)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ====================== ROTAS ======================
app.get('/', (req, res) => {
  res.json({ message: 'API MS-LAB funcionando com PostgreSQL!' });
});

// Rotas sem prefixo /api (compatível com seu frontend atual)
app.use(require('./routes/auth'));           // ← /login e /register
app.use('/operadores', require('./routes/operadores'));
app.use('/objetos', require('./routes/objetos'));
app.use('/logs', require('./routes/logs'));

// ====================== 404 ======================
app.use((req, res) => {
  console.log(`❌ 404 - Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: 'Rota não encontrada', 
    method: req.method, 
    url: req.url 
  });
});

// ====================== START ======================
app.listen(port, () => {
  console.log(`🚀 Servidor MS-LAB rodando em http://localhost:${port}`);
});