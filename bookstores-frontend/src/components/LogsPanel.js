import React, { useState, useMemo, useContext } from 'react';
import { X, LogOut, RefreshCw, Download, Trash2, ArrowUpDown, Filter, Sun, Moon } from 'lucide-react'; // Додано Sun, Moon
import { API_URL } from '../utils/api';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { translations } from '../translations';

function parseLog(raw) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        return {
            event: raw.event || 'Невідома подія',
            user: raw.user || '—',
            user_id: raw.user_id || null,
            time: raw.time || '—',
            _raw: raw
        };
    }
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && parsed.event) {
                return { event: parsed.event, user: parsed.user || '—', user_id: parsed.user_id || null, time: parsed.time || '—', _raw: parsed };
            }
        } catch (e) { }
        const match = raw.match(/^\[(.+?)\]\s+(.+)$/);
        if (match) {
            return { event: match[2], user: '—', user_id: null, time: match[1].replace('T', ' ').replace('Z', ''), _raw: raw };
        }
        return { event: raw, user: '—', user_id: null, time: '—', _raw: raw };
    }
    return { event: String(raw || 'Невідоме значення'), user: '—', user_id: null, time: '—', _raw: raw };
}

export default function LogsPanel({
    currentUser,
    logs,
    loading,
    fetchLogs,
    clearLogs,
    setShowLogs,
    handleLogout
}) {
    const { theme, toggleTheme } = useContext(ThemeContext); // Додано toggleTheme
    const { language, toggleLanguage } = useContext(LanguageContext); // Додано toggleLanguage
    const t = translations[language];
    const isDark = theme === 'dark';

    const [sortBy, setSortBy] = useState('date-desc');
    const [filterUser, setFilterUser] = useState('');
    const [filterEventType, setFilterEventType] = useState('');

    // Спеціальні терміни для логів
    const extraTerms = {
        uk: { enabled: 'увімкнено', disabled: 'вимкнено', dept: 'відділ', userNotFound: 'користувача не знайдено' },
        en: { enabled: 'enabled', disabled: 'disabled', dept: 'department', userNotFound: 'user not found' }
    };

    const translateEvent = (eventText, targetLang = language) => {
        if (!eventText) return '';
        let translated = eventText;
        const currentT = translations[targetLang];
        const currentExtra = extraTerms[targetLang];

        if (eventText.includes('ЗМІНА ФІЛЬТРА: відділ')) {
            let deptName = "";
            let status = "";
            Object.keys(translations.uk.departmentNames).forEach(uaKey => {
                if (eventText.includes(uaKey)) deptName = uaKey;
            });
            if (eventText.includes('увімкнено')) status = 'enabled';
            if (eventText.includes('вимкнено')) status = 'disabled';

            if (targetLang === 'en' && deptName) {
                const enDept = currentT.departmentNames[deptName];
                const enStatus = currentExtra[status];
                return `${enDept} ${currentExtra.dept} filter change: ${enStatus}`;
            }
        }

        const systemMap = {
            'ВХІД УСПІШНИЙ': currentT.logLoginSuccess,
            'НЕВДАЛИЙ ВХІД': currentT.logLoginFail,
            'РЕЄСТРАЦІЯ УСПІШНА': currentT.logRegisterSuccess,
            'ОНОВЛЕНО КНИГАРНЮ': currentT.logStoreUpdated,
            'ДОДАНО КНИГАРНЮ': currentT.logStoreAdded,
            'ВИДАЛЕНО КНИГАРНЮ': currentT.logStoreDeleted,
            'ВИХІД': currentT.logLogout,
            'ЗМІНА ФІЛЬТРА': currentT.logFilterChange,
            'ПОШУК КНИГАРЕНЬ': currentT.logSearch,
            'ЛОГИ ОЧИЩЕНО': currentT.logsCleared,
            'користувача не знайдено': currentExtra.userNotFound,
            'відділ': currentExtra.dept,
            'увімкнено': currentExtra.enabled,
            'вимкнено': currentExtra.disabled
        };

        Object.entries(systemMap).forEach(([ua, replacement]) => {
            translated = translated.replace(new RegExp(ua, 'gi'), replacement);
        });

        Object.keys(translations.uk.departmentNames).forEach(uaDept => {
            const replacementDept = currentT.departmentNames[uaDept];
            translated = translated.replace(new RegExp(uaDept, 'g'), replacementDept);
        });

        return translated;
    };

    const downloadLogs = () => {
        if (!logs || logs.length === 0) {
            alert(t.noLogsToDownload);
            return;
        }
        try {
            const fileLogs = parsedLogs.map(log => {
                const targetLang = language === 'uk' ? 'uk' : 'en';
                return {
                    time: log.time,
                    user: log.user,
                    event: translateEvent(log.event, targetLang)
                };
            });
            const jsonString = JSON.stringify(fileLogs, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const dateStr = new Date().toISOString().slice(0, 10);
            link.href = url;
            link.download = `bookstore_logs_${language}_${dateStr}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download error:", err);
        }
    };

    const EVENT_TYPES = [
        { label: t.logAllTypes, value: '' },
        { label: t.logLoginSuccess, value: 'ВХІД УСПІШНИЙ' },
        { label: t.logLoginFail, value: 'НЕВДАЛИЙ ВХІД' },
        { label: t.logStoreUpdated, value: 'ОНОВЛЕНО КНИГАРНЮ' },
        { label: t.logFilterChange, value: 'ЗМІНА ФІЛЬТРА' },
    ];

    const parsedLogs = useMemo(() => {
        if (!logs || logs.length === 0) return [];
        return logs.map((raw, index) => ({ ...parseLog(raw), _index: index }));
    }, [logs]);

    const uniqueUsers = useMemo(() => {
        const users = parsedLogs.map(l => l.user).filter(u => u && u !== '—');
        return [...new Set(users)].sort();
    }, [parsedLogs]);

    const sortedAndFilteredLogs = useMemo(() => {
        if (!parsedLogs.length) return [];
        let filtered = parsedLogs;
        if (filterUser) filtered = filtered.filter(l => l.user === filterUser);
        if (filterEventType) filtered = filtered.filter(l => l.event.toUpperCase().includes(filterEventType.toUpperCase()));
        return [...filtered].sort((a, b) => {
            const dateA = new Date(a.time), dateB = new Date(b.time);
            if (sortBy === 'date-desc') return dateB - dateA;
            if (sortBy === 'date-asc') return dateA - dateB;
            return 0;
        });
    }, [parsedLogs, sortBy, filterUser, filterEventType]);

    function getRowClass(log, isDark) {
        const e = log.event.toUpperCase();
        if (e.includes('НЕВДАЛИЙ') || e.includes('ВИДАЛЕННЯ') || e.includes('ВИДАЛЕНО')) return isDark ? ' bg-red-900/40 border-red-700' : ' bg-red-50 border-red-200';
        if (e.includes('УСПІШНИЙ')) return isDark ? ' bg-green-900/40 border-green-700' : ' bg-green-50 border-green-200';
        return '';
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-blue-50 text-gray-900'}`}>
            <div className={`p-4 shadow-lg ${isDark ? 'bg-indigo-900' : 'bg-indigo-600 text-white'}`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-bold mb-1 truncate">📋 {t.logsTitle}</h1>
                        <p className="text-xs opacity-90 truncate">👤 {currentUser.username} {t.adminBadge}</p>
                    </div>

                    {/* НОВИЙ БЛОК: Кнопки мови та теми */}
                    <div className="flex items-center gap-1.5 ml-2">
                        <button
                            onClick={toggleLanguage}
                            className="px-2 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition text-[10px] font-bold"
                        >
                            {language === 'uk' ? 'EN' : 'УКР'}
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition"
                        >
                            {isDark ? <Sun size={15} className="text-yellow-300" /> : <Moon size={15} />}
                        </button>
                        <button onClick={() => setShowLogs(false)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition">
                            <X size={15} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-1.5 mb-2">
                    <button onClick={fetchLogs} className="flex-1 bg-white/10 py-2 rounded-lg text-xs flex items-center justify-center gap-1"><RefreshCw size={13} /> {t.refreshLabel}</button>
                    <button onClick={downloadLogs} className="flex-1 bg-green-600 py-2 rounded-lg text-xs flex items-center justify-center gap-1"><Download size={13} /> {t.downloadLogs}</button>
                    <button onClick={clearLogs} className="flex-1 bg-red-600 py-2 rounded-lg text-xs flex items-center justify-center gap-1"><Trash2 size={13} /> {t.clearAllLogs}</button>
                </div>

                <div className="flex gap-1.5 mt-2">
                    <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className={`flex-1 text-xs p-1.5 rounded border border-white/20 ${isDark ? 'bg-gray-800' : 'bg-indigo-500'}`}>
                        <option value="">{t.logAllUsers}</option>
                        {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <select value={filterEventType} onChange={e => setFilterEventType(e.target.value)} className={`flex-1 text-xs p-1.5 rounded border border-white/20 ${isDark ? 'bg-gray-800' : 'bg-indigo-500'}`}>
                        {EVENT_TYPES.map(et => <option key={et.value} value={et.value}>{et.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="p-4">
                <div className={`rounded-xl shadow-md p-4 transition-colors ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <h2 className="text-sm font-semibold mb-4">{t.logRecords}: {sortedAndFilteredLogs.length}</h2>
                    <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                        {sortedAndFilteredLogs.map((log) => (
                            <div key={log._index} className={`p-3 rounded-lg border text-sm ${getRowClass(log, isDark)} ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                                <p className="font-medium">{translateEvent(log.event)}</p>
                                <p className="text-[10px] opacity-60 mt-1">👤 {log.user} • 🕐 {log.time}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}