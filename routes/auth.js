
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();   

// ====================== REGISTER ======================
router.post('/register', async (req, res) => {
  const { login, senha, nome, email, permissao_id } = req.body;

  if (!login || !senha || !nome || !email) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios' });
  }

  try {
    const hashedSenha = await bcrypt.hash(senha, 10);
    const result = await db.query(
      `INSERT INTO operador (login, senha, nome, email, codigo, permissao_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [login, hashedSenha, nome, email, crypto.randomUUID(), permissao_id || null]
    );

    res.status(201).json({ 
      message: 'Operador registrado com sucesso', 
      id: result.rows[0].id 
    });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Login já cadastrado' });
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao registrar' });
  }
});

// ====================== LOGIN ======================
router.post('/login', async (req, res) => {
  const { login, senha } = req.body;

  if (!login || !senha) {
    return res.status(400).json({ error: 'Login e senha são obrigatórios' });
  }

  try {
    const result = await db.query(`
      SELECT o.*, p.nome as permissao_nome 
      FROM operador o 
      LEFT JOIN permissao p ON o.permissao_id = p.id 
      WHERE o.login = $1`, [login]);

    const operador = result.rows[0];

    if (!operador || !(await bcrypt.compare(senha, operador.senha))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { 
        id: operador.id, 
        login: operador.login,
        permissao_nome: operador.permissao_nome
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ 
      message: 'Login realizado com sucesso', 
      token,
      permissao_nome: operador.permissao_nome 
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no login' });
  }
});

module.exports = router;