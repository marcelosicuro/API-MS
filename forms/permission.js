// forms/permission.js
function checkAdminAccess(redirectTo = 'menu.html') {
    const permissao = localStorage.getItem('permissao_nome')?.toLowerCase().trim();
    if (!permissao || (permissao !== 'admin' && permissao !== 'administrador')) {
        alert('🚫 Acesso restrito a Administradores.');
        window.location.href = redirectTo;
        return false;
    }
    return true;
}

window.checkAdminAccess = checkAdminAccess;