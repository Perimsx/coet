import { authFetch } from './api.js';
import { $, toggleModal, showToast } from './utils.js';

export function checkAuth() {
    if (!localStorage.getItem('token')) {
        window.location.href = '/login.html'; // Ensure full path
    }
}

export function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}
