// middlewares/auth.js
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  console.error('❌ JWT_SECRET não definido no .env');
  process.exit(1);
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token obrigatório' });
  }

  jwt.verify(token, SECRET_KEY, (err, operador) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    
    req.operador = operador;   // contém: id, login, permissao_nome
    next();
  });
};

module.exports = { authenticateToken };