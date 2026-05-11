// middlewares/permission.js
const hasPermission = (requiredPermission) => {
  return (req, res, next) => {
    const operador = req.operador;
    
    if (!operador || !operador.permissao_nome) {
      console.log('❌ Permissão não encontrada no token');
      return res.status(403).json({ error: 'Usuário sem permissão definida' });
    }

    const userPerm = operador.permissao_nome.toLowerCase().trim();
    const required = requiredPermission.toLowerCase().trim();

    console.log(`🔐 Verificando permissão → Usuário: ${operador.login} | Tem: "${operador.permissao_nome}" | Necessário: "${requiredPermission}"`);

    // Aceita tanto "admin" quanto "administrador"
    if (userPerm === required || 
        userPerm === 'administrador' || 
        userPerm === 'admin') {
      return next();
    }

    return res.status(403).json({ 
      error: `Acesso negado. Necessário: ${requiredPermission}. Você tem: ${operador.permissao_nome}` 
    });
  };
};

module.exports = { hasPermission };