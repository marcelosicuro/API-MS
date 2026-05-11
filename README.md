# 🚀 MS-LAB - API de Gestão

Sistema de gerenciamento interno com controle de operadores, inventário de objetos e logs de atividade.

## Sobre o Projeto

API REST desenvolvida para controle interno do laboratório MS-LAB, com sistema completo de autenticação, permissões (RBAC) e interface web simples.

## ✨ Funcionalidades

- **Autenticação JWT** com login e registro
- **Controle de Permissões** (RBAC) - Apenas Admin pode gerenciar operadores
- **Gestão de Operadores** (CRUD)
- **Gestão de Objetos/Inventário** (CRUD + valor total)
- **Logs de Atividade** completos (IP, data, página e usuário)
- Interface responsiva com Bootstrap 5
- Suporte a Docker (em desenvolvimento)

## 🛠 Tecnologias Utilizadas

- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT + bcrypt
- **Frontend**: HTML5, CSS3, JavaScript + Bootstrap 5
- **Containerização**: Docker + Docker Compose