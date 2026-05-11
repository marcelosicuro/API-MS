// routes/operadores.js
const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middlewares/auth');
const { hasPermission } = require('../middlewares/permission');

const router = express.Router();

// ====================== LISTAGEM (LIBERADA PARA ADMIN) ======================
router.get('/', authenticateToken, hasPermission('admin'), async (req, res) => {
  try {
    const filtro = req.query.filtro || '';
    const result = await db.query(`
      SELECT o.id, o.login, o.nome, o.email, o.codigo, o.permissao_id,
             p.nome as permissao_nome
      FROM operador o 
      LEFT JOIN permissao p ON o.permissao_id = p.id
      WHERE o.nome ILIKE $1 OR o.login ILIKE $1 OR o.email ILIKE $1
      ORDER BY o.nome`, [`%${filtro}%`]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar operadores' });
  }
});

router.get('/permissoes', authenticateToken, hasPermission('admin'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, nome FROM permissao WHERE ativo = true ORDER BY nome'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar permissões' });
  }
});

// ====================== ROTAS DE ESCRITA (APENAS ADMIN) ======================
router.put('/:id', authenticateToken, hasPermission('admin'), /* ... seu update */);
router.delete('/:id', authenticateToken, hasPermission('admin'), /* ... seu delete */);

module.exports = router;