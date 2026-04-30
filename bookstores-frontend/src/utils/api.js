export const API_URL = 'https://kyiv-bookstores-app-copy.onrender.com/api';

console.log('[API] URL:', API_URL);

export const logClientEvent = async (username, event, details = {}) => {
    if (!username || typeof username !== 'string') {
        console.debug('[LOG] немає валідного username, логування пропущено');
        return;
    }
    if (typeof event !== 'string' || event.trim() === '') {
        console.warn('[LOG] Невалідна назва події:', event);
        return;
    }
    try {
        await fetch(`${API_URL}/log/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, event, details })
        });
    } catch (err) {
        console.debug('[LOG EVENT] помилка:', err);
    }
};