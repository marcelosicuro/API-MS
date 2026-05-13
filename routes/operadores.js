// routes/operadores.js
const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middlewares/auth');
const { hasPermission } = require('../middlewares/permission');

const router = express.Router();

// ====================== LISTAGEM ======================
router.get('/', authenticateToken, hasPermission('admin'), async (req, res) => {
  try {
    const filtro = req.query.filtro || '';
    
    const result = await db.query(`
      SELECT 
        o.id, 
        o.login, 
        o.nome, 
        o.email, 
        o.codigo,
        o.permissao_id,
        p.nome as permissao_nome
      FROM operador o 
      LEFT JOIN permissao p ON o.permissao_id = p.id
      WHERE o.nome ILIKE $1 
         OR o.login ILIKE $1 
         OR o.email ILIKE $1
      ORDER BY o.nome ASC`, [`%${filtro}%`]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar operadores:', error);
    res.status(500).json({ error: 'Erro ao buscar operadores' });
  }
});

// ====================== PERMISSÕES ======================
router.get('/permissoes', authenticateToken, hasPermission('admin'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, nome FROM permissao WHERE ativo = true ORDER BY nome'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao carregar permissões:', error);
    res.status(500).json({ error: 'Erro ao carregar permissões' });
  }
});

// ====================== ATUALIZAR OPERADOR ======================
router.put('/:id', authenticateToken, hasPermission('admin'), async (req, res) => {
  const { id } = req.params;
  const { nome, email, permissao_id } = req.body;

  try {
    const result = await db.query(`
      UPDATE operador 
      SET nome = $1, 
          email = $2, 
          permissao_id = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 
      RETURNING id, nome, email, permissao_id`,
      [nome, email, permissao_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operador não encontrado' });
    }

    res.json({ message: 'Operador atualizado com sucesso', operador: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar operador:', error);
    res.status(500).json({ error: 'Erro ao atualizar operador' });
  }
});

// ====================== DELETAR OPERADOR ======================
router.delete('/:id', authenticateToken, hasPermission('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM operador WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operador não encontrado' });
    }

    res.json({ message: 'Operador deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar operador:', error);
    res.status(500).json({ error: 'Erro ao deletar operador' });
  }
});

module.exports = router;