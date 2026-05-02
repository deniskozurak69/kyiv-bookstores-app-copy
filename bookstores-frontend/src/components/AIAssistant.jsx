import React, { useState, useRef, useEffect, useContext, useMemo } from 'react';
import { X, Send, Loader2, Bot, User, MapPin, Star } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { translations } from '../translations';
import { Geolocation } from '@capacitor/geolocation';

// ─── Константи (Глобальні) ────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const ALL_DEPARTMENTS = [
    'Художня література', 'Наукова література', 'Дитяча література',
    'Бізнес', 'Поезія', 'Українська класика', 'Іноземні мови',
    'Канцтовари', 'Подарункові видання',
];

const DAY_ORDER = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// ─── Допоміжні функції (Поза компонентом) ──────────────────────────────────────
function timeToMinutes(str) {
    if (!str) return null;
    const match = String(str).trim().match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function parseSegment(segment) {
    const s = segment.trim();
    const times = s.match(/\d{1,2}:\d{2}/g);
    if (!times || times.length < 2) return null;
    const open = timeToMinutes(times[0]);
    const close = timeToMinutes(times[times.length - 1]);
    if (open === null || close === null) return null;
    const dayPart = s.split(/\d{1,2}:\d{2}/)[0].trim().replace(/\s*,\s*/g, ',');
    const days = new Set();
    const tokens = dayPart.split(',');
    for (const token of tokens) {
        const range = token.trim().match(/^([A-Za-z]{2})-([A-Za-z]{2})$/);
        if (range) {
            const from = DAY_ORDER.indexOf(range[1]);
            const to = DAY_ORDER.indexOf(range[2]);
            if (from !== -1 && to !== -1) {
                for (let i = from; i <= to; i++) days.add(DAY_ORDER[i]);
            }
        } else {
            const single = token.trim();
            if (DAY_ORDER.includes(single)) days.add(single);
        }
    }
    return { days: [...days], open, close };
}

function storeWorksAt(hoursStr, dayOsm, filterFrom, filterTo) {
    if (!hoursStr) return true;
    const segments = hoursStr.split(';').map(s => s.trim()).filter(Boolean);
    for (const seg of segments) {
        const parsed = parseSegment(seg);
        if (!parsed) continue;
        const dayMatch = parsed.days.length === 0 || parsed.days.includes(dayOsm);
        if (!dayMatch) continue;
        if (filterFrom < parsed.close && parsed.open < filterTo) return true;
    }
    return false;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function callGemini(prompt) {
    if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');
    const requestBody = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
    };
    try {
        const res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err) {
        console.error('🚨 Gemini Error:', err);
        throw err;
    }
}

// ─── Головний компонент ───────────────────────────────────────────────────────
export default function AIAssistant({ isOpen, onClose, bookstores, onApplyFilters }) {
    const { theme } = useContext(ThemeContext);
    const { language } = useContext(LanguageContext);
    const t = translations[language];
    const isDark = theme === 'dark';

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('initial');
    const [collectedData, setCollectedData] = useState({ genres: [], timeInfo: null });
    const [matchedStores, setMatchedStores] = useState([]);
    const messagesEndRef = useRef(null);

    // Словник перекладів для AI (використовуємо useMemo, щоб не перераховувати постійно)
    const aiT = useMemo(() => ({
        uk: {
            welcome: `Привіт! 👋 Я допоможу знайти підходящу книгарню.\n\nНапишіть мені:\n• Які книги або жанри вас цікавлять?\n• В який час плануєте відвідати (напр. "субота 12:00" або "час неважливий")?`,
            notUnderstood: "Не зовсім зрозумів 🤔",
            askGenres: "• Які книги або жанри вас цікавлять?",
            askTime: "• В який час плануєте відвідати?",
            noResults: "Нічого не знайдено за такими критеріями. Спробуйте обрати інші жанри.",
            foundCount: (n) => `Я знайшов **${n}** книгарень. Як їх відсортувати?`,
            sortingPrompt: "Оберіть: **за відстанню** чи **за рейтингом**?",
            gettingLoc: "Отримую вашу локацію... 📍",
            locDenied: "Геолокацію не надано. Відсортую за рейтингом.",
            filtersApplied: "Фільтри застосовано! Дивіться результати нижче 👇",
            newSearch: "Новий пошук",
            placeholder: "Напишіть повідомлення...",
            sortByDist: "За відстанню",
            sortByRate: "За рейтингом",
            topResults: "Топ результати:",
            km: "км",
            startAgain: "🔄 Почати спочатку",
            error: "❌ Помилка:"
        },
        en: {
            welcome: `Hello! 👋 I'll help you find a suitable bookstore.\n\nTell me:\n• What books or genres are you interested in?\n• What time do you plan to visit (e.g. "Saturday 12:00" or "time doesn't matter")?`,
            notUnderstood: "I didn't quite get that 🤔",
            askGenres: "• What books or genres are you interested in?",
            askTime: "• What time do you plan to visit?",
            noResults: "Nothing found for these criteria. Try choosing different genres.",
            foundCount: (n) => `I found **${n}** bookstores. How should I sort them?`,
            sortingPrompt: "Choose: **by distance** or **by rating**?",
            gettingLoc: "Getting your location... 📍",
            locDenied: "Location denied. Sorting by rating instead.",
            filtersApplied: "Filters applied! See results below 👇",
            newSearch: "New search",
            placeholder: "Type a message...",
            sortByDist: "By distance",
            sortByRate: "By rating",
            topResults: "Top results:",
            km: "km",
            startAgain: "🔄 Start over",
            error: "❌ Error:"
        }
    }), [])[language];

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ role: 'assistant', text: aiT.welcome }]);
            setStep('collecting');
        }
        // Оновлюємо привітання, якщо мова змінилася на самому старті
        if (isOpen && messages.length === 1 && messages[0].role === 'assistant') {
            setMessages([{ role: 'assistant', text: aiT.welcome }]);
        }
    }, [isOpen, language, aiT.welcome]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addMessage = (role, text, extra = {}) => {
        setMessages(prev => [...prev, { role, text, ...extra }]);
    };

    const extractUserIntent = async (userMessage) => {
        const prompt = `
        Task: Extract user preferences into JSON.
        Message: "${userMessage}"
        Available Departments: ${ALL_DEPARTMENTS.join(', ')}
        
        Return ONLY valid JSON:
        {
          "genres": ["exact names from Available Departments"],
          "timeInfo": { "dayOsm": "Mo/Tu/We/Th/Fr/Sa/Su", "timeFrom": "HH:mm", "timeTo": "HH:mm", "anyTime": boolean },
          "hasGenres": boolean,
          "hasTime": boolean
        }`;

        const raw = await callGemini(prompt);
        const jsonMatch = raw.replace(/```json|```/gi, "").trim().match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    };

    const generateAIResponse = async (situation, details) => {
        const prompt = `
        You are a friendly assistant for Kyiv Bookstores app. 
        Language: ${language === 'uk' ? 'Ukrainian' : 'English'}.
        Situation: ${situation}. Details: ${JSON.stringify(details)}.
        Provide a 1-sentence friendly response.`;
        return await callGemini(prompt);
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userText = input.trim();
        setInput('');
        addMessage('user', userText);
        setLoading(true);

        try {
            if (step === 'collecting') {
                const extracted = await extractUserIntent(userText);
                if (!extracted) throw new Error("AI parsing error");

                const newData = {
                    genres: extracted.hasGenres ? extracted.genres : collectedData.genres,
                    timeInfo: (extracted.hasTime || extracted.timeInfo) ? extracted.timeInfo : collectedData.timeInfo,
                };
                setCollectedData(newData);

                // Перевірка чи достатньо даних
                const hasGenres = newData.genres.length > 0;
                const hasTime = !!newData.timeInfo;

                if (!hasGenres || !hasTime) {
                    let ask = `${aiT.notUnderstood}\n`;
                    if (!hasGenres) ask += `${aiT.askGenres}\n`;
                    if (!hasTime) ask += `${aiT.askTime}`;
                    addMessage('assistant', ask);
                    return;
                }

                // Фільтрація
                let filtered = bookstores.filter(s =>
                    newData.genres.some(g => s.departments?.includes(g))
                );

                if (newData.timeInfo && !newData.timeInfo.anyTime) {
                    const from = timeToMinutes(newData.timeInfo.timeFrom || "00:00");
                    const to = timeToMinutes(newData.timeInfo.timeTo || "23:59");
                    filtered = filtered.filter(s => storeWorksAt(s.hours, newData.timeInfo.dayOsm, from, to));
                }

                if (filtered.length === 0) {
                    addMessage('assistant', aiT.noResults);
                } else {
                    setMatchedStores(filtered);
                    setStep('sorting');
                    const aiMsg = await generateAIResponse('found stores', { count: filtered.length });
                    addMessage('assistant', `${aiMsg}\n\n${aiT.foundCount(filtered.length)}`, { showSortButtons: true });
                }
            } else if (step === 'sorting') {
                const lower = userText.toLowerCase();
                if (lower.includes('dist') || lower.includes('відстан') || lower.includes('близьк')) await handleSortByDistance();
                else if (lower.includes('rat') || lower.includes('рейтинг') || lower.includes('оцінк')) handleSortByRating();
                else addMessage('assistant', aiT.sortingPrompt, { showSortButtons: true });
            }
        } catch (err) {
            addMessage('assistant', `${aiT.error} ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSortByDistance = async () => {
        addMessage('assistant', aiT.gettingLoc);
        try {
            const pos = await Geolocation.getCurrentPosition({ timeout: 8000 });
            const { latitude, longitude } = pos.coords;
            const sorted = [...matchedStores].sort((a, b) =>
                haversineDistance(latitude, longitude, parseFloat(a.latitude), parseFloat(a.longitude)) -
                haversineDistance(latitude, longitude, parseFloat(b.latitude), parseFloat(b.longitude))
            );
            finishSearch(sorted, 'distance', [latitude, longitude]);
        } catch {
            addMessage('assistant', aiT.locDenied);
            handleSortByRating();
        }
    };

    const handleSortByRating = () => {
        const sorted = [...matchedStores].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        finishSearch(sorted, 'rating', null);
    };

    const finishSearch = async (sorted, sortType, coords) => {
        onApplyFilters({
            departments: collectedData.genres,
            filterDay: collectedData.timeInfo?.dayOsm || '',
            timeFrom: collectedData.timeInfo?.timeFrom || '',
            timeTo: collectedData.timeInfo?.timeTo || '',
            sortedStores: sorted,
            sortType,
            userPosition: coords
        });

        const aiMsg = await generateAIResponse('ready', { count: sorted.length });
        addMessage('assistant', `${aiMsg}\n\n${aiT.filtersApplied}`, {
            showResults: true,
            stores: sorted.slice(0, 3),
            sortType,
            userPosition: coords
        });
        setStep('done');
    };

    const handleReset = () => {
        setMessages([{ role: 'assistant', text: aiT.welcome }]);
        setStep('collecting');
        setCollectedData({ genres: [], timeInfo: null });
        setMatchedStores([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className={`w-full sm:max-w-lg h-[90vh] sm:h-[600px] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl transition-colors ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                {/* Header */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl border-b ${isDark ? 'bg-indigo-900 border-gray-700' : 'bg-indigo-600'}`}>
                    <div className="flex items-center gap-2 text-white">
                        <Bot size={22} />
                        <span className="font-semibold">{language === 'uk' ? 'AI-асистент' : 'AI Assistant'}</span>
                    </div>
                    <button
                        onClick={() => {
                            handleReset(); // Скидаємо чат
                            onClose();     // Закриваємо
                        }}
                        className="text-white/80 hover:text-white"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-700' : 'bg-indigo-100'}`}>
                                    <Bot size={16} className={isDark ? 'text-indigo-200' : 'text-indigo-600'} />
                                </div>
                            )}
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? (isDark ? 'bg-indigo-700 text-white' : 'bg-indigo-600 text-white') : (isDark ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-900')}`}>
                                <p className="whitespace-pre-line">{msg.text}</p>
                                {msg.showSortButtons && (
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={handleSortByDistance} className="flex-1 flex items-center justify-center gap-1 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">
                                            <MapPin size={13} /> {aiT.sortByDist}
                                        </button>
                                        <button onClick={handleSortByRating} className="flex-1 flex items-center justify-center gap-1 py-2 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                            <Star size={13} /> {aiT.sortByRate}
                                        </button>
                                    </div>
                                )}
                                {msg.showResults && (
                                    <div className="mt-3 space-y-2 pt-2 border-t border-black/5">
                                        <p className="text-[10px] font-bold uppercase opacity-50">{aiT.topResults}</p>
                                        {msg.stores.map((s, j) => (
                                            <div key={j} className={`rounded-xl px-3 py-2 text-xs ${isDark ? 'bg-gray-700/50' : 'bg-white shadow-sm border border-gray-100'}`}>
                                                <p className="font-bold">{s.name}</p>
                                                {msg.sortType === 'distance' && msg.userPosition && s.latitude && (
                                                    <p className="opacity-60">{(haversineDistance(msg.userPosition[0], msg.userPosition[1], parseFloat(s.latitude), parseFloat(s.longitude)) / 1000).toFixed(1)} {aiT.km}</p>
                                                )}
                                                {msg.sortType === 'rating' && <p className="text-yellow-500 font-medium">★ {s.averageRating || 'N/A'}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && <div className="flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    {step === 'done' ? (
                        <button onClick={handleReset} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition">{aiT.startAgain}</button>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder={aiT.placeholder}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'}`}
                            />
                            <button onClick={handleSend} disabled={loading || !input.trim()} className="p-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50">
                                <Send size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}