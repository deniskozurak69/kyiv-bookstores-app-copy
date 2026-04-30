import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <LanguageProvider>
                    <App />
                </LanguageProvider>
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>
);

reportWebVitals();
