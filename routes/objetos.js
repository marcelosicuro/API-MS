const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { filtro } = req.body;
    const result = await db.query(
      'SELECT id, nomeobjeto, quantidade, valor FROM objeto WHERE nomeobjeto ILIKE $1',
      [`%${filtro || ''}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar objetos' });
  }
});

router.get('/valorTotal', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT COALESCE(SUM(valor * quantidade), 0) as valortotal 
            FROM objeto
        `);

        res.json({ 
            valortotal: parseFloat(result.rows[0].valortotal) || 0 
        });

    } catch (error) {
        console.error('Erro ao calcular valor total dos objetos:', error);
        res.status(500).json({ error: 'Erro ao calcular valor total' });
    }
});

router.post('/incluirObjeto', authenticateToken, async (req, res) => {
  const { nomeobjeto, quantidade, valor } = req.body;

  if (!nomeobjeto) return res.status(400).json({ error: 'Nome do objeto é obrigatório' });

  try {
    const result = await db.query(
      `INSERT INTO objeto (nomeobjeto, quantidade, valor) 
       VALUES ($1, $2, $3) RETURNING id`,
      [nomeobjeto, quantidade || 0, valor || 0]
    );
    res.status(201).json({ 
      message: 'Objeto registrado com sucesso', 
      id: result.rows[0].id 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar objeto' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nomeobjeto, quantidade, valor } = req.body;

  if (!nomeobjeto) return res.status(400).json({ error: 'Nome do objeto é obrigatório' });

  try {
    const result = await db.query(
      `UPDATE objeto SET nomeobjeto = $1, quantidade = $2, valor = $3 
       WHERE id = $4 RETURNING id`,
      [nomeobjeto, quantidade || 0, valor || 0, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Objeto não encontrado' });

    res.json({ message: 'Objeto atualizado com sucesso', id, nomeobjeto, quantidade, valor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar objeto' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM objeto WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Objeto não encontrado' });

    res.json({ message: 'Objeto deletado com sucesso', id: req.params.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar objeto' });
  }
});

module.exports = router;