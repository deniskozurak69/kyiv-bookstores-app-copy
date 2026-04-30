import React, { useState, useMemo, useContext } from 'react';
import { X, LogOut, RefreshCw, Download, Trash2, ArrowUpDown, Filter } from 'lucide-react';
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
    downloadLogs,
    clearLogs,
    setShowLogs,
    handleLogout
}) {
    const { theme } = useContext(ThemeContext);
    const { language } = useContext(LanguageContext);
    const t = translations[language];
    const isDark = theme === 'dark';

    const [sortBy, setSortBy] = useState('date-desc');
    const [filterUser, setFilterUser] = useState('');
    const [filterEventType, setFilterEventType] = useState('');

    const EVENT_TYPES = [
        { label: t.logAllTypes, value: '' },
        { label: t.logLoginSuccess, value: 'ВХІД УСПІШНИЙ' },
        { label: t.logLoginFail, value: 'НЕВДАЛИЙ ВХІД' },
        { label: t.logRegisterSuccess, value: 'РЕЄСТРАЦІЯ УСПІШНА' },
        { label: t.logStoreUpdated, value: 'ОНОВЛЕНО КНИГАРНЮ' },
        { label: t.logStoreAdded, value: 'ДОДАНО КНИГАРНЮ' },
        { label: t.logStoreDeleted, value: 'ВИДАЛЕНО КНИГАРНЮ' },
        { label: t.logLogout, value: 'ВИХІД' },
        { label: t.logFilterChange, value: 'ЗМІНА ФІЛЬТРА' },
        { label: t.logSearch, value: 'ПОШУК КНИГАРЕНЬ' },
    ];

    const handleDeleteLog = async (index) => {
        if (!window.confirm(t.confirmDeleteLog)) return;
        try {
            const response = await fetch(`${API_URL}/auth/logs/${index}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser.username })
            });
            const data = await response.json();
            if (response.ok) {
                fetchLogs();
            } else {
                alert(data.error || t.deleteLogError);
            }
        } catch (err) {
            alert(t.connectionError);
        }
    };

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
            const dateA = new Date(a.time);
            const dateB = new Date(b.time);
            if (sortBy === 'date-desc') return dateB - dateA;
            if (sortBy === 'date-asc') return dateA - dateB;
            if (sortBy === 'type') return a.event.localeCompare(b.event) || dateB - dateA;
            if (sortBy === 'user') return (a.user || '').localeCompare(b.user || '') || dateB - dateA;
            return 0;
        });
    }, [parsedLogs, sortBy, filterUser, filterEventType]);

    function getRowClass(log, isDark) {
        const e = log.event.toUpperCase();
        if (e.includes('НЕВДАЛИЙ') || e.includes('ВИДАЛЕННЯ') || e.includes('ОЧИЩЕННЯ') || e.includes('ВИДАЛЕНО')) {
            return isDark ? ' bg-red-900/40 border-red-700' : ' bg-red-50 border-red-200';
        }
        if (e.includes('ВХІД УСПІШНИЙ') || e.includes('РЕЄСТРАЦІЯ УСПІШНА')) {
            return isDark ? ' bg-green-900/40 border-green-700' : ' bg-green-50 border-green-200';
        }
        if (e.includes('ДОДАНО') || e.includes('ОНОВЛЕНО')) {
            return isDark ? ' bg-blue-900/40 border-blue-700' : ' bg-blue-50 border-blue-200';
        }
        return '';
    }

    const selectClass = `text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/50 ${isDark ? 'bg-gray-700 text-gray-200 border border-gray-600' : 'bg-white/20 text-white border border-white/30'
        }`;

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark
                ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100'
                : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-900'
            }`}>
            {/* Шапка */}
            <div className={`p-4 shadow-lg transition-colors duration-300 ${isDark
                    ? 'bg-gradient-to-r from-indigo-800 to-purple-900'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                }`}>
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">📋 {t.logsTitle}</h1>
                        <p className="text-xs opacity-90">👤 {currentUser.username} {t.adminBadge}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowLogs(false)}
                            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-white/20 hover:bg-white/30 text-white'
                                }`}>
                            <X size={15} /> {t.close}
                        </button>
                        <button onClick={handleLogout}
                            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${isDark ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
                                }`}>
                            <LogOut size={15} /> {t.logoutLabel}
                        </button>
                    </div>
                </div>

                {/* Кнопки дій */}
                <div className="flex gap-1.5 mb-2">
                    <button onClick={fetchLogs}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-lg transition-colors ${isDark ? 'bg-indigo-700 hover:bg-indigo-600 text-white' : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                            }`}>
                        <RefreshCw size={13} /> {t.refreshLabel}
                    </button>
                    {logs.length > 0 && (
                        <>
                            <button onClick={downloadLogs}
                                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-lg transition-colors ${isDark ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-500 hover:bg-green-400 text-white'
                                    }`}>
                                <Download size={13} /> {t.downloadLogs}
                            </button>
                            <button onClick={clearLogs}
                                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-lg transition-colors ${isDark ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-500 hover:bg-red-400 text-white'
                                    }`}>
                                <Trash2 size={13} /> {t.clearAllLogs}
                            </button>
                        </>
                    )}
                </div>

                {logs.length > 0 && (
                    <>
                        {/* Сортування */}
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <ArrowUpDown size={14} className="text-gray-300 shrink-0" />
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectClass}>
                                <option value="date-desc">{t.sortDateDesc}</option>
                                <option value="date-asc">{t.sortDateAsc}</option>
                                <option value="type">{t.sortByType}</option>
                                <option value="user">{t.sortByUser}</option>
                            </select>
                        </div>

                        {/* Фільтри */}
                        <div className="flex gap-1.5">
                            <div className="flex-1 flex items-center gap-1">
                                <Filter size={13} className="text-gray-300 shrink-0" />
                                <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
                                    className={`w-full ${selectClass}`}>
                                    <option value="">{t.logAllUsers}</option>
                                    {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <select value={filterEventType} onChange={e => setFilterEventType(e.target.value)}
                                    className={`w-full ${selectClass}`}>
                                    {EVENT_TYPES.map(et => (
                                        <option key={et.value} value={et.value}>{et.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Основний контент */}
            <div className="p-4">
                <div className={`rounded-xl shadow-md p-4 transition-colors duration-300 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {t.logRecords}: {sortedAndFilteredLogs.length}
                        {(filterUser || filterEventType) && (
                            <button onClick={() => { setFilterUser(''); setFilterEventType(''); }}
                                className="ml-3 text-xs text-indigo-400 hover:text-indigo-300 underline">
                                {t.resetFilters}
                            </button>
                        )}
                    </h2>

                    {loading ? (
                        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t.loading}
                        </div>
                    ) : sortedAndFilteredLogs.length === 0 ? (
                        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {logs.length === 0 ? t.logsEmpty : t.noLogsForFilter}
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                            {sortedAndFilteredLogs.map((log) => {
                                const baseClass = `p-3 rounded-lg border flex justify-between items-start gap-3 transition-colors ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                                    }${getRowClass(log, isDark)}`;

                                return (
                                    <div key={log._index} className={baseClass}>
                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <p className={`text-sm font-medium break-words ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                                {log.event}
                                            </p>
                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                👤 {log.user}
                                                {log.user_id && ` (ID ${log.user_id})`}
                                                {' · '}
                                                🕐 {log.time}
                                            </p>
                                        </div>
                                        <button onClick={() => handleDeleteLog(log._index)}
                                            className={`p-1 rounded hover:bg-opacity-20 transition shrink-0 ${isDark ? 'text-red-400 hover:bg-red-900/50' : 'text-red-600 hover:bg-red-100'
                                                }`}
                                            title={t.deleteLogEntry}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}