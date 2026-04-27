const express = require('express');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'chave-super-secreta'; // use variável de ambiente em produção

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const db = new Database('db-api.db');

// Criação da tabela
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL
  )
`);

// Middleware de autenticação JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

//#region Usuários
// Registro de usuário
app.post('/register', async (req, res) => {
  const { username, password, name, email } = req.body;

  if (!username || !password || !name || !email) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username deve ter no mínimo 3 caracteres' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password, name, email) VALUES (?, ?, ?, ?)');
    const result = stmt.run(username, hashedPassword, name, email);
    res.status(201).json({ message: 'Usuário registrado com sucesso', id: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Username já cadastrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao registrar usuário' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e senha são obrigatórios' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: 'Login realizado com sucesso', token});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no login' });
  }
});

// Listar usuários
app.get('/users', authenticateToken, (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, name, email FROM users').all();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Listar usuários com
app.get('/getNomeUsuario/:username', authenticateToken, (req, res) => {
  try {
    const usuario = db.prepare('SELECT name FROM users WHERE username = ?').get(req.params.username);
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar o nome do usuário' });
  }
});

// Atualizar usuário
app.put('/users/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name e email são obrigatórios' });
  }

  try {
    const stmt = db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?');
    const result = stmt.run(name, email, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário atualizado com sucesso', id, name, email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Deletar usuário
app.delete('/users/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário deletado com sucesso', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});
//#endregion

//#region Objetos

// Listar objetos com filtro via POST
app.post('/objeto', authenticateToken, (req, res) => {
  try {
    const { filtro } = req.body; // agora funciona, pois é POST
    const objeto = db.prepare(
      'SELECT id, nomeobjeto, quantidade, valor FROM objeto WHERE nomeobjeto LIKE ?'
    ).all(`%${filtro || ''}%`);
    
    res.json(objeto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar objetos' });
  }
});


app.get('/valorObjeto', authenticateToken, (req, res) => {
  try {
    const objeto = db.prepare('SELECT SUM((o.valor * o.quantidade)) as valortotalobjeto FROM objeto o').all();
    res.json(objeto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao somar valor dos objetos' });
  }
});


// Registro de objeto
app.post('/incluirObjeto', async (req, res) => {
  const { nomeobjeto, quantidade, valor } = req.body;

  if (!nomeobjeto) {
    return res.status(400).json({ error: 'Nome do objeto é obrigatório' });
  }

  try {
    const stmt = db.prepare('INSERT INTO objeto (nomeobjeto, quantidade, valor) VALUES (?, ?, ?)');
    const result = stmt.run(nomeobjeto, quantidade, valor);
    res.status(201).json({ message: 'Objeto registrado com sucesso', id: result.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao registrar objeto' });
  }
});

// Deletar objeto
app.delete('/objeto/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare('DELETE FROM objeto WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Objeto não encontrado' });
    }

    res.json({ message: 'Objeto deletado com sucesso', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar objeto' });
  }
});

// Atualizar objeto
app.put('/objeto/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { nomeobjeto, quantidade, valor } = req.body;

  if (!nomeobjeto) {
    return res.status(400).json({ error: 'Nome do objeto é obrigatório' });
  }

  try {
    const stmt = db.prepare('UPDATE objeto SET nomeobjeto = ?, quantidade = ?, valor = ? WHERE id = ?');
    const result = stmt.run(nomeobjeto, quantidade, valor, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Objeto não encontrado' });
    }

    res.json({ message: 'Objeto atualizado com sucesso', id, nomeobjeto, quantidade, valor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar objeto' });
  }
});
//#endregion





app.post('/incluirLog', async (req, res) => {
  const { ip, data} = req.body;

  
  try {
    const stmt = db.prepare('INSERT INTO log (ip, data) VALUES (?, ?)');
    const result = stmt.run(ip, data);
    res.status(201).json({ message: 'Log registrado com sucesso', id: result.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao registrar log' });
  }
});


// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', method: req.method, path: req.originalUrl });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
