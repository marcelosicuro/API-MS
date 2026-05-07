const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const db = require('./db'); // ← Importando o banco

const app = express();
const port = 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'chave-super-secreta';

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  jwt.verify(token, SECRET_KEY, (err, operador) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.operador = operador;
    next();
  });
};

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando com PostgreSQL!' });
});

// ====================== Operadores ======================

app.post('/register', async (req, res) => {
  const { login, senha, nome, email } = req.body;

  if (!login || !senha || !nome || !email) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }
  if (login.length < 3) return res.status(400).json({ error: 'login deve ter no mínimo 3 caracteres' });
  if (senha.length < 6) return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });

  try {
    const hashedsenha = await bcrypt.hash(senha, 10);
    const result = await db.query(
      `INSERT INTO operador (login, senha, nome, email, codigo) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [login, hashedsenha, nome, email, crypto.randomUUID()]
    );

    res.status(201).json({ 
      message: 'Operador registrado com sucesso', 
      id: result.rows[0].id 
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'login já cadastrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao registrar operador' });
  }
});

app.post('/login', async (req, res) => {
  const { login, senha } = req.body;

  if (!login || !senha) {
    return res.status(400).json({ error: 'login e senha são obrigatórios' });
  }

  try {
    const result = await db.query('SELECT * FROM operador WHERE login = $1', [login]);
    const operador = result.rows[0];

    if (!operador || !(await bcrypt.compare(senha, operador.senha))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: operador.id, login: operador.login }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: 'Login realizado com sucesso', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no login' });
  }
});

app.get('/operador', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM operador');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar operadores' });
  }
});

app.get('/getNomeUsuario/:login', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, nome FROM operador WHERE login = $1', [req.params.login]);
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar o nome do usuário' });
  }
});

app.put('/operador/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nome, email } = req.body;

  if (!nome || !email) return res.status(400).json({ error: 'nome e email são obrigatórios' });

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

app.delete('/operador/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM operador WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Operador não encontrado' });

    res.json({ message: 'Operador deletado com sucesso', id: req.params.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar operador' });
  }
});

// ====================== OBJETOS ======================

app.post('/objeto', authenticateToken, async (req, res) => {
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

app.get('/valorObjeto', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT SUM(valor * quantidade) as valortotalobjeto FROM objeto');
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao somar valor dos objetos' });
  }
});

app.post('/incluirObjeto', async (req, res) => {
  const { nomeobjeto, quantidade, valor } = req.body;

  if (!nomeobjeto) return res.status(400).json({ error: 'Nome do objeto é obrigatório' });

  try {
    const result = await db.query(
      `INSERT INTO objeto (nomeobjeto, quantidade, valor) VALUES ($1, $2, $3) RETURNING id`,
      [nomeobjeto, quantidade, valor]
    );
    res.status(201).json({ message: 'Objeto registrado com sucesso', id: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar objeto' });
  }
});

app.put('/objeto/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nomeobjeto, quantidade, valor } = req.body;

  if (!nomeobjeto) return res.status(400).json({ error: 'Nome do objeto é obrigatório' });

  try {
    const result = await db.query(
      `UPDATE objeto SET nomeobjeto = $1, quantidade = $2, valor = $3 WHERE id = $4 RETURNING id`,
      [nomeobjeto, quantidade, valor, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Objeto não encontrado' });

    res.json({ message: 'Objeto atualizado com sucesso', id, nomeobjeto, quantidade, valor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar objeto' });
  }
});

app.delete('/objeto/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM objeto WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Objeto não encontrado' });

    res.json({ message: 'Objeto deletado com sucesso', id: req.params.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar objeto' });
  }
});

// ====================== LOG ======================
app.post('/incluirLogf', async (req, res) => {
  const { ip, data, pagina, operador } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO log (ip, data, pagina, operador) VALUES ($1, $2, $3, $4) RETURNING id',
      [ip, data, pagina, operador]
    );
    res.status(201).json({ message: 'Log registrado com sucesso', id: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar log' });
  }
});

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});