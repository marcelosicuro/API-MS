# API-MS

Sua primeira API construída com Node.js e Express.

## Como Começar

1. Instale as dependências: `npm install`

2. Inicie o servidor: `npm start`

3. Visite http://localhost:3000

## Endpoints

- GET / : Mensagem de boas-vindas

- POST /register : Registra novo usuário (JSON: {"username": "user", "password": "123", "name": "João"})

- POST /login : Faz login e retorna JWT token (JSON: {"username": "user", "password": "123"})

- GET /api : Dados de exemplo da API

- GET /users : Lista todos os usuários (requer Authorization: Bearer TOKEN)

- POST /users : Protegido por autenticação

## Armazenamento

Os usuários são armazenados em um banco de dados SQLite (users.db) com senhas criptografadas.

## Como Usar Autenticação

1. Registre um usuário:
   ```
   POST http://localhost:3000/register
   Body: {"username": "joao", "password": "123456", "name": "João"}
   ```

2. Faça login:
   ```
   POST http://localhost:3000/login
   Body: {"username": "joao", "password": "123456"}
   ```

3. Use o token retornado para acessar endpoints protegidos:
   ```
   GET http://localhost:3000/users
   Header: Authorization: Bearer SEU_TOKEN_AQUI
   ```