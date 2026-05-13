// routes/operadores.js
const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middlewares/auth');
// const { hasPermission } = require('../middlewares/permission'); // ← desativado temporariamente

const router = express.Router();

// ====================== LISTAGEM ======================
router.get('/', authenticateToken, async (req, res) => {   // ← sem hasPermission
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
router.get('/permissoes', authenticateToken, async (req, res) => {   // ← sem hasPermission
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

// ====================== BUSCAR NOME + PERMISSÃO ======================
router.get('/getNomeUsuario/:login', authenticateToken, async (req, res) => {
    const { login } = req.params;

    try {
        const result = await db.query(`
            SELECT o.nome, p.nome as permissao_nome 
            FROM operador o 
            LEFT JOIN permissao p ON o.permissao_id = p.id
            WHERE o.login = $1 
            LIMIT 1`, [login]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

// ====================== ATUALIZAR ======================
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nome, email, permissao_id } = req.body;

  try {
    const result = await db.query(`
      UPDATE operador 
      SET nome = $1, email = $2, permissao_id = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 
      RETURNING *`, [nome, email, permissao_id, id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Operador não encontrado' });

    res.json({ message: 'Operador atualizado', operador: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

// ====================== DELETAR ======================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM operador WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Não encontrado' });
    res.json({ message: 'Deletado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar' });
  }
});

// ====================== TOTAL DE OPERADORES ======================
router.get('/total', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT COUNT(*) as total FROM operador');
        
        res.json({ 
            total: parseInt(result.rows[0].total) || 0 
        });
    } catch (error) {
        console.error('Erro ao contar operadores:', error);
        res.status(500).json({ error: 'Erro ao contar operadores' });
    }
});

module.exports = router;