const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const filtro = req.query.filtro || '';
    const result = await db.query(
      `SELECT id, login, nome, email, codigo 
       FROM operador 
       WHERE nome ILIKE $1 OR login ILIKE $1 OR email ILIKE $1
       ORDER BY nome`,
      [`%${filtro}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar operadores' });
  }
});

router.get('/getNomeUsuario/:login', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, nome FROM operador WHERE login = $1', [req.params.login]);
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar o nome do usuário' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nome, email } = req.body;

  if (!nome || !email) return res.status(400).json({ error: 'Nome e email são obrigatórios' });

  try {
    const result = await db.query(
      'UPDATE operador SET nome = $1, email = $2 WHERE id = $3 RETURNING id',
      [nome, email, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Operador não encontrado' });

    res.json({ message: 'Operador atualizado com sucesso', id, nome, email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar operador' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM operador WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Operador não encontrado' });

    res.json({ message: 'Operador deletado com sucesso', id: req.params.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar operador' });
  }
});

module.exports = router;