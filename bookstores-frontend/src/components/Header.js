import React, { useContext } from 'react';
import { User, Shield, FileText, LogOut, RefreshCw, Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { translations } from '../translations';

export default function Header({
    currentUser,
    isAdmin,
    mode,
    setMode,
    setShowLogs,
    fetchBookstores,
    handleLogout,
}) {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { language, toggleLanguage } = useContext(LanguageContext);
    const t = translations[language];

    return (
        <div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
            <div className="px-4 pt-4 pb-5">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">{t.appTitle}</h1>
                        <p className="text-xs opacity-90">
                            👤 {currentUser.username} {isAdmin && t.adminBadge}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Перемикач мови */}
                        <button
                            onClick={toggleLanguage}
                            className="px-2 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition text-xs font-semibold tracking-wide"
                            aria-label="Switch language"
                        >
                            {language === 'uk' ? 'EN' : 'УКР'}
                        </button>

                        {/* Перемикач теми */}
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition"
                            aria-label="Перемкнути тему"
                        >
                            {theme === 'dark'
                                ? <Sun size={16} className="text-yellow-300" />
                                : <Moon size={16} className="text-white" />}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/20 hover:bg-white/30 rounded-lg transition"
                        >
                            <LogOut size={15} /> {t.logoutLabel}
                        </button>
                    </div>
                </div>

                {isAdmin ? (
                    <div className="space-y-2">
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => { setMode('user'); setShowLogs(false); }}
                                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition ${mode === 'user'
                                    ? 'bg-white text-indigo-600 font-semibold'
                                    : 'bg-indigo-500 text-white hover:bg-indigo-400'
                                    }`}
                            >
                                <User size={15} /> {t.userLabel}
                            </button>
                            <button
                                onClick={() => { setMode('admin'); setShowLogs(false); }}
                                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition ${mode === 'admin'
                                    ? 'bg-white text-indigo-600 font-semibold'
                                    : 'bg-indigo-500 text-white hover:bg-indigo-400'
                                    }`}
                            >
                                <Shield size={15} /> {t.adminLabel}
                            </button>
                            <button
                                onClick={() => { setShowLogs(true); }}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-500 hover:bg-purple-400 rounded-lg transition"
                            >
                                <FileText size={15} /> {t.logsLabel}
                            </button>
                        </div>
                        <div>
                            <button
                                onClick={fetchBookstores}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-500 hover:bg-indigo-400 rounded-lg transition"
                            >
                                <RefreshCw size={15} /> {t.refreshLabel}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <button
                            onClick={fetchBookstores}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-500 hover:bg-indigo-400 rounded-lg transition"
                        >
                            <RefreshCw size={15} /> {t.refreshLabel}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}