// utils/api.js
export const API_URL = (() => {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:3001/api`;
    }
    return 'http://localhost:3001/api';
})();

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
            body: JSON.stringify({
                username,
                event,
                details
            })
        });
        // помилки тихо ігноруємо
    } catch (err) {
        console.debug('[LOG EVENT] помилка:', err);
    }
};