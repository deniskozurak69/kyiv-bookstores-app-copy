import React, { useState, useRef, useEffect, useContext } from 'react';
import { X, Send, Loader2, Bot, User, MapPin, Star } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { Geolocation } from '@capacitor/geolocation';

// ─── Константи ────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_KEY;   // ←←← ЗМІНИ ЦЕ

const GEMINI_MODEL = "gemini-2.5-flash";   // ←←← ЗМІНИ НА ЦЕ

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const ALL_DEPARTMENTS = [
    'Художня література', 'Наукова література', 'Дитяча література',
    'Бізнес', 'Поезія', 'Українська класика', 'Іноземні мови',
    'Канцтовари', 'Подарункові видання',
];

const DAY_ORDER = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// ─── Допоміжні функції ────────────────────────────────────────────────────────
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

// ─── ВИПРАВЛЕНИЙ Gemini з детальним логуванням ────────────────────────────────
async function callGemini(prompt) {
    if (!GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY не знайдено!');
        throw new Error('Gemini API ключ не налаштовано');
    }
    

    const requestBody = {
        contents: [
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ],
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            topP: 0.95,
            topK: 40
        }
    };
    console.log(GEMINI_API_KEY)
    console.log(`📤 Запит до Gemini (${GEMINI_MODEL}):`, prompt.substring(0, 250) + '...');

    try {
        const res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('❌ Gemini API помилка:', {
                status: res.status,
                model: GEMINI_MODEL,
                response: errorText
            });
            throw new Error(`Gemini API помилка: ${res.status} - ${errorText.substring(0, 400)}`);
        }

        const data = await res.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        console.log('✅ Gemini відповів успішно');
        return responseText;
    } catch (err) {
        console.error('🚨 Помилка при виклику callGemini:', err);
        throw err;
    }
}

// ─── Промпт 1: екстракція даних (посилений) ─────────────────────────────────
async function extractUserIntent(userMessage) {
    const prompt = `
Твоє завдання: витягти дані у форматі JSON. 
Повідомлення: "${userMessage}"
Доступні відділи: ${ALL_DEPARTMENTS.join(', ')}

Поверни ТІЛЬКИ чистий JSON за цим шаблоном:
{
  "genres": ["назва"],
  "bounds": { "minLat": 50.3, "maxLat": 50.6, "minLng": 30.3, "maxLng": 30.7 },
  "timeInfo": { "dayOsm": "Sa", "timeFrom": "10:00", "timeTo": "18:00", "anyTime": false },
  "hasGenres": true,
  "hasLocation": true
}
Якщо локація не вказана, використовуй дефолтні координати Києва (50.3-50.6, 30.3-30.7).
Будь лаконічним. Починай відповідь одразу з JSON`;

    try {
        let raw = await callGemini(prompt);
        console.log("=== AI RAW RESPONSE ===", raw);

        // 1. Очищення від маркдауну (прибираємо ```json і ```)
        const cleaned = raw.replace(/```json|```/gi, "").trim();

        // 2. Пошук самого об'єкта {}
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("AI не надіслав JSON. Отримано:", raw);
            throw new Error("Invalid AI response format");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // 3. Перевірка обов'язкових полів
        if (!parsed.genres || parsed.genres.length === 0) {
            parsed.genres = ["Художня література"];
            parsed.hasGenres = true;
        }

        if (!parsed.bounds) {
            parsed.bounds = { minLat: 50.3, maxLat: 50.6, minLng: 30.3, maxLng: 30.7 };
        }

        return parsed;
    } catch (e) {
        console.error("🚨 Помилка обробки:", e);
        // Повертаємо безпечний дефолт, щоб додаток не впав
        return {
            genres: ["Художня література"],
            bounds: { minLat: 50.3, maxLat: 50.6, minLng: 30.3, maxLng: 30.7 },
            timeInfo: { anyTime: true },
            hasGenres: true,
            hasLocation: false
        };
    }
}

// ─── Промпт 2: формування відповіді ─────────────────────────────────────────
async function generateResponse(situation, details) {
    const prompt = `
Ти — дружній AI-асистент додатку "Книгарні Києва". Відповідай українською, коротко і по суті.
Ситуація: ${situation}
Деталі: ${JSON.stringify(details, null, 2)}
Згенеруй коротке повідомлення для користувача (1-3 речення).
`;
    return await callGemini(prompt);
}

// ─── Головний компонент ───────────────────────────────────────────────────────
export default function AIAssistant({ isOpen, onClose, bookstores, onApplyFilters }) {
    const { theme } = useContext(ThemeContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('initial');
    const [collectedData, setCollectedData] = useState({ genres: [], timeInfo: null });
    const [matchedStores, setMatchedStores] = useState([]);
    const [userPosition, setUserPosition] = useState(null);
    const messagesEndRef = useRef(null);

    // Привітання
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                role: 'assistant',
                text: `Привіт! 👋 Я допоможу знайти підходящу книгарню.\n\nНапишіть мені:\n• Які книги або жанри вас цікавлять?\n• В який час плануєте відвідати (або "час неважливий")?`,
            }]);
            setStep('collecting');
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addMessage = (role, text, extra = {}) => {
        setMessages(prev => [...prev, { role, text, ...extra }]);
    };

    // ─── Обробка повідомлення ─────────────────────────────────
    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userText = input.trim();
        setInput('');
        addMessage('user', userText);
        setLoading(true);

        try {
            if (step === 'collecting') {
                await handleCollecting(userText);
            } else if (step === 'sorting') {
                await handleSorting(userText);
            }
        } catch (err) {
            console.error('Full Error Object:', err);
            // Виводимо текст помилки в чат для діагностики
            addMessage('assistant', `❌ Помилка обробки: ${err.message}. Перевірте консоль (F12) для деталей.`);
        } finally {
            setLoading(false);
        }
    };

    // Крок 1: Збір даних
    const handleCollecting = async (userText) => {
        try {
            const extracted = await extractUserIntent(userText);

            const newData = {
                genres: extracted.hasGenres ? extracted.genres : collectedData.genres,
                timeInfo: extracted.hasTime ? extracted.timeInfo : collectedData.timeInfo,
            };

            setCollectedData(newData);

            const missingGenres = !extracted.hasGenres && newData.genres.length === 0;
            const missingTime = !extracted.hasTime && !newData.timeInfo;

            if (missingGenres || missingTime) {
                let ask = 'Не зовсім зрозумів 🤔\n';
                if (missingGenres) ask += '• Які книги або жанри вас цікавлять?\n';
                if (missingTime) ask += '• В який час плануєте відвідати? (або "час неважливий")';
                addMessage('assistant', ask);
                return;
            }

            await searchByDepartments(newData);
        } catch (err) {
            console.error('❌ Помилка в handleCollecting:', err);
            addMessage('assistant', 'Вибачте, не вдалося обробити ваш запит. Спробуйте перефразувати.');
        }
    };

    // Пошук за відділами
    const searchByDepartments = async (data) => {
        const { genres, timeInfo, bounds } = data;

        // 1. Фільтр за відділами ТА Геолокацією
        let filtered = bookstores.filter(store => {
            const hasGenre = genres.length === 0 || genres.some(g => store.departments?.includes(g));

            // Перевірка чи входить книгарня в прямокутник координат
            const lat = parseFloat(store.latitude);
            const lng = parseFloat(store.longitude);
            const isInBounds = !bounds || (
                lat >= bounds.minLat && lat <= bounds.maxLat &&
                lng >= bounds.minLng && lng <= bounds.maxLng
            );

            return hasGenre && isInBounds;
        });

        if (filtered.length === 0) {
            const msg = await generateResponse('Нічого не знайдено за такими критеріями', { genres, bounds });
            addMessage('assistant', msg + "\n\nСпробуйте змінити район або обрати інші жанри.");
            setStep('collecting');
            return;
        }

        // 2. Фільтр за часом
        if (!timeInfo?.anyTime && timeInfo?.dayOsm) {
            const from = timeToMinutes(timeInfo.timeFrom || "00:00");
            const to = timeToMinutes(timeInfo.timeTo || "23:59");

            const byTime = filtered.filter(store =>
                storeWorksAt(store.hours, timeInfo.dayOsm, from, to)
            );

            if (byTime.length === 0) {
                addMessage('assistant', "Книгарні у цьому районі є, але вони зачинені у вибраний час. Показати їх все одно?");
                // Можна додати логіку пропозиції змінити час
                filtered = filtered; // Залишаємо як є для наглядності
            } else {
                filtered = byTime;
            }
        }

        // 3. Успішний результат
        setMatchedStores(filtered);
        setStep('sorting');

        const msg = await generateResponse('Знайдено результати', { count: filtered.length });
        addMessage('assistant',
            `${msg}\n\nЯ знайшов **${filtered.length}** книгарень у вибраній локації.\n\nЯк їх відсортувати?`,
            { showSortButtons: true }
        );
    };

    // Крок 2: Сортування (без змін, тільки з логуванням)
    const handleSorting = async (userText) => {
        const lower = userText.toLowerCase();
        const byDistance = lower.includes('відстан') || lower.includes('близьк') || lower.includes('геолок');
        const byRating = lower.includes('рейтинг') || lower.includes('оцінк');

        if (!byDistance && !byRating) {
            addMessage('assistant', 'Оберіть: **за відстанню** чи **за рейтингом**?', { showSortButtons: true });
            return;
        }

        if (byDistance) await sortByDistance();
        else sortByRating();
    };

    const sortByDistance = async () => {
        addMessage('assistant', 'Отримую вашу локацію... 📍');
        try {
            const perm = await Geolocation.requestPermissions();
            if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
                addMessage('assistant', 'Геолокацію не надано. Відсортую за рейтингом.');
                sortByRating();
                return;
            }
            const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000 });
            const { latitude, longitude } = pos.coords;
            setUserPosition([latitude, longitude]);

            const sorted = [...matchedStores]
                .filter(s => s.latitude && s.longitude)
                .sort((a, b) =>
                    haversineDistance(latitude, longitude, parseFloat(a.latitude), parseFloat(b.longitude)) -
                    haversineDistance(latitude, longitude, parseFloat(b.latitude), parseFloat(b.longitude))
                );

            applyResults(sorted, 'distance', { latitude, longitude });
        } catch (err) {
            console.error('❌ Помилка геолокації:', err);
            addMessage('assistant', 'Не вдалося отримати геолокацію. Відсортую за рейтингом.');
            sortByRating();
        }
    };

    const sortByRating = () => {
        const sorted = [...matchedStores].sort((a, b) =>
            (b.averageRating || 0) - (a.averageRating || 0)
        );
        applyResults(sorted, 'rating', null);
    };

    const applyResults = async (sorted, sortType, geoData) => {
        const { genres, timeInfo } = collectedData;
        onApplyFilters({
            departments: genres,
            filterDay: timeInfo?.anyTime ? '' : (timeInfo?.dayOsm || ''),
            timeFrom: timeInfo?.anyTime ? '' : (timeInfo?.timeFrom || ''),
            timeTo: timeInfo?.anyTime ? '' : (timeInfo?.timeTo || ''),
            sortedStores: sorted,
            sortType,
            userPosition: geoData ? [geoData.latitude, geoData.longitude] : null,
        });

        const msg = await generateResponse(
            `Результати готові, відсортовано за ${sortType === 'distance' ? 'відстанню' : 'рейтингом'}`,
            { count: sorted.length, sortType }
        );

        addMessage('assistant', msg + '\n\nФільтри застосовано! Дивіться результати нижче 👇', {
            showResults: true,
            stores: sorted.slice(0, 3),
            sortType,
            userPosition: geoData,
        });

        setStep('done');
    };

    const handleReset = () => {
        setMessages([{
            role: 'assistant',
            text: `Починаємо спочатку! 🔄\n\nНапишіть мені:\n• Які книги або жанри вас цікавлять?\n• В який час плануєте відвідати (або "час неважливий")?`,
        }]);
        setStep('collecting');
        setCollectedData({ genres: [], timeInfo: null });
        setMatchedStores([]);
    };

    if (!isOpen) return null;

    const isDark = theme === 'dark';

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className={`w-full sm:max-w-lg h-[90vh] sm:h-[600px] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl transition-colors ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                {/* Хедер */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl border-b ${isDark ? 'bg-indigo-900 border-gray-700' : 'bg-indigo-600'}`}>
                    <div className="flex items-center gap-2 text-white">
                        <Bot size={22} />
                        <span className="font-semibold">AI-асистент</span>
                        <span className="text-xs opacity-70">Gemini</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {step === 'done' && (
                            <button onClick={handleReset}
                                className="text-xs text-white/80 hover:text-white border border-white/30 rounded-lg px-2 py-1 transition">
                                Новий пошук
                            </button>
                        )}
                        <button onClick={onClose} className="text-white/80 hover:text-white transition">
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Повідомлення */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isDark ? 'bg-indigo-700' : 'bg-indigo-100'}`}>
                                    <Bot size={14} className={isDark ? 'text-indigo-200' : 'text-indigo-600'} />
                                </div>
                            )}
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user'
                                ? isDark ? 'bg-indigo-700 text-white' : 'bg-indigo-600 text-white'
                                : isDark ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-900'
                                }`}>
                                <p className="whitespace-pre-line leading-relaxed">
                                    {msg.text.split(/\*\*(.+?)\*\*/g).map((part, j) =>
                                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                                    )}
                                </p>

                                {msg.showSortButtons && (
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={sortByDistance} className="flex-1 flex items-center justify-center gap-1 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                                            <MapPin size={13} /> За відстанню
                                        </button>
                                        <button onClick={sortByRating} className="flex-1 flex items-center justify-center gap-1 py-2 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                                            <Star size={13} /> За рейтингом
                                        </button>
                                    </div>
                                )}

                                {msg.showResults && msg.stores?.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        <p className="text-xs font-semibold opacity-70">Топ результати:</p>
                                        {msg.stores.map((s, j) => (
                                            <div key={j} className={`rounded-lg px-3 py-2 text-xs ${isDark ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                                                <p className="font-semibold">{j + 1}. {s.name}</p>
                                                <p className="opacity-70 mt-0.5">{s.address}</p>
                                                {msg.sortType === 'rating' && s.averageRating && (
                                                    <p className="text-yellow-500 mt-0.5">★ {s.averageRating}</p>
                                                )}
                                                {msg.sortType === 'distance' && msg.userPosition && s.latitude && (
                                                    <p className="opacity-70 mt-0.5">
                                                        {(haversineDistance(
                                                            msg.userPosition[0], msg.userPosition[1],
                                                            parseFloat(s.latitude), parseFloat(s.longitude)
                                                        ) / 1000).toFixed(1)} км
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {msg.role === 'user' && (
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <User size={14} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-2 justify-start">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isDark ? 'bg-indigo-700' : 'bg-indigo-100'}`}>
                                <Bot size={14} className={isDark ? 'text-indigo-200' : 'text-indigo-600'} />
                            </div>
                            <div className={`rounded-2xl px-4 py-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <Loader2 size={16} className="animate-spin text-indigo-500" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Поле вводу */}
                {step !== 'done' && (
                    <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                placeholder="Напишіть повідомлення..."
                                disabled={loading}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${isDark
                                    ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400'
                                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                                    }`}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className={`p-2.5 rounded-xl transition ${input.trim() && !loading
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    : isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                                    }`}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 'done' && (
                    <div className={`px-4 py-3 border-t text-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <button onClick={handleReset} className="text-sm text-indigo-500 hover:text-indigo-400 transition">
                            🔄 Почати новий пошук
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}