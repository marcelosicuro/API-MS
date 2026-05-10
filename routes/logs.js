const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  const { pagina, operador } = req.body;

  let clientIp = req.ip || 
                 req.headers['x-forwarded-for'] || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress ||
                 'IP desconhecido';

  if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') clientIp = '127.0.0.1';
  if (clientIp.startsWith('::ffff:')) clientIp = clientIp.replace('::ffff:', '');

  try {
    const result = await db.query(
      `INSERT INTO log (ip, data, pagina, operador) 
       VALUES ($1, NOW() AT TIME ZONE 'America/Sao_Paulo', $2, $3) 
       RETURNING id`,
      [clientIp, pagina, operador]
    );

    res.status(201).json({ 
      message: 'Log registrado com sucesso', 
      id: result.rows[0].id 
    });
  } catch (error) {
    console.error('Erro ao registrar log:', error);
    res.status(500).json({ error: 'Erro ao registrar log' });
  }
});

router.get('/getLog', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, ip, data AT TIME ZONE 'America/Sao_Paulo' as data, pagina, operador 
       FROM log ORDER BY data DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ error: 'Erro ao buscar logs' });
  }
});

module.exports = router;