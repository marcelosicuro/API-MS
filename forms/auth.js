//const API_URL = 'http://localhost:3000';

async function authFetch(url, options = {}) {
    let token = localStorage.getItem('accessToken');

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': options.body ? 'application/json' : undefined
        }
    });

    // Se o token expirou → tenta renovar
    if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
            return authFetch(url, options); // tenta novamente
        } else {
            localStorage.clear();
            window.location.href = 'index.html';
            return null;
        }
    }

    return response;
}

async function refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_URL}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('accessToken', data.accessToken);
            return true;
        }
    } catch (e) {
        console.error('Erro no refresh token', e);
    }
    return false;
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// Exportar funções para usar nas páginas
window.authFetch = authFetch;
window.logout = logout;