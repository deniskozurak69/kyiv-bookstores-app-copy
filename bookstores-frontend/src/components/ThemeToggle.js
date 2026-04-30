import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);

    console.log('[THEME] поточна тема:', theme);

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            aria-label="Перемкнути тему"
        >
            {theme === 'dark' ? (
                <Sun size={20} className="text-yellow-400" />
            ) : (
                <Moon size={20} className="text-indigo-600" />
            )}
        </button>
    );
};

export default ThemeToggle;