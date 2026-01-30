const API_BASE = '/api';

export function getToken() {
    return localStorage.getItem('token');
}

export async function authFetch(url, options = {}) {
    const token = getToken();
    if (!token) {
        window.location.href = '/login.html'; // Ensure full path
        return;
    }

    const headers = options.headers || {};
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API_BASE + url, {
        ...options,
        headers
    });

    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        return;
    }

    return res;
}
