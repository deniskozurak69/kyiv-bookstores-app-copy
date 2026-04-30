import React, { useContext } from 'react';
import { User, Lock, BookOpen, Globe } from 'lucide-react';
import { LanguageContext } from '../context/LanguageContext';
import { translations } from '../translations';

export default function AuthForm({
    showRegister,
    setShowRegister,
    authForm,
    setAuthForm,
    authError,
    setAuthError,
    loading,
    handleLogin,
    handleRegister,
    onKeyPress,
    onOpenGuide, // Новий проп для відкриття інструкції
}) {
    const { language, toggleLanguage } = useContext(LanguageContext);
    const t = translations[language];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

                {/* Перемикач мови */}
                <div className="flex justify-end mb-2">
                    <button
                        onClick={toggleLanguage}
                        type="button"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
                    >
                        <Globe size={14} />
                        {language === 'uk' ? 'English' : 'Українська'}
                    </button>
                </div>

                {/* Заголовок */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">📚</div>
                    <h1 className="text-3xl font-bold text-indigo-600 mb-2">{t.appTitle}</h1>
                    <p className="text-gray-600">
                        {showRegister ? t.createAccount : t.signIn}
                    </p>
                </div>

                {/* Помилка */}
                {authError && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                        {authError}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Логін */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <User size={16} className="inline mr-1" /> {t.authUsername}
                        </label>
                        <input
                            type="text"
                            value={authForm.username}
                            onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                            onKeyPress={onKeyPress}
                            placeholder={t.authUsernamePlaceholder}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        />
                    </div>

                    {/* Пароль */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Lock size={16} className="inline mr-1" /> {t.authPassword}
                        </label>
                        <input
                            type="password"
                            value={authForm.password}
                            onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                            onKeyPress={onKeyPress}
                            placeholder={t.authPasswordPlaceholder}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        />
                        {showRegister && (
                            <div className="text-xs text-gray-500 mt-2 space-y-1">
                                <p>{t.passwordRequirements}</p>
                                <ul className="list-disc list-inside pl-4">
                                    <li>{t.passwordNeedsUpper}</li>
                                    <li>{t.passwordNeedsLower}</li>
                                    <li>{t.passwordNeedsDigits}</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Кнопка входу / реєстрації */}
                    <button
                        onClick={showRegister ? handleRegister : handleLogin}
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400"
                    >
                        {loading ? t.loading : (showRegister ? t.registerButton : t.loginButton)}
                    </button>

                    {/* Перемикач між входом і реєстрацією */}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setShowRegister(!showRegister);
                                setAuthError('');
                                setAuthForm({ username: '', password: '' });
                            }}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                            {showRegister ? t.alreadyHaveAccount : t.noAccount}
                        </button>
                    </div>

                    {/* Посібник - тепер викликає внутрішній компонент */}
                    <div className="pt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onOpenGuide}
                            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                            <BookOpen size={16} />
                            {t.openGuide}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}