const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { login, senha, nome, email } = req.body;

  if (!login || !senha || !nome || !email) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }
  if (login.length < 3) return res.status(400).json({ error: 'Login deve ter no mínimo 3 caracteres' });
  if (senha.length < 6) return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });

  try {
    const hashedSenha = await bcrypt.hash(senha, 10);
    const result = await db.query(
      `INSERT INTO operador (login, senha, nome, email, codigo) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [login, hashedSenha, nome, email, crypto.randomUUID()]
    );

    res.status(201).json({ 
      message: 'Operador registrado com sucesso', 
      id: result.rows[0].id 
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Login já cadastrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao registrar operador' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { login, senha } = req.body;

  if (!login || !senha) {
    return res.status(400).json({ error: 'Login e senha são obrigatórios' });
  }

  try {
    const result = await db.query('SELECT * FROM operador WHERE login = $1', [login]);
    const operador = result.rows[0];

    if (!operador || !(await bcrypt.compare(senha, operador.senha))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: operador.id, login: operador.login }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' }
    );

    res.json({ message: 'Login realizado com sucesso', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no login' });
  }
});

module.exports = router;