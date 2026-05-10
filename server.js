// server.js
const helmet = require('helmet');
const express = require('express');
const cors = require('cors');
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

// Rotas sem prefixo /api (para compatibilidade com frontend atual)
app.use(require('./routes/auth'));           // ← /login, /register
app.use('/operadores', require('./routes/operadores'));
app.use('/objetos', require('./routes/objetos'));
app.use('/logs', require('./routes/logs'));

// ====================== 404 ======================
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ====================== START ======================
app.listen(port, () => {
  console.log(`🚀 Servidor MS-LAB rodando em http://localhost:${port}`);
});