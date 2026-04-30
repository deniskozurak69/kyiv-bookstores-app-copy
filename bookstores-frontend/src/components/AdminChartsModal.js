import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { API_URL } from '../utils/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { X, Loader2 } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { translations } from '../translations';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
    '#FF5733', '#C70039', '#900C3F', '#581845', '#2ECC71', '#3498DB'
];

const formatTimeLabel = (label) => {
    if (label === null || label === undefined) return String(label);
    if (typeof label === 'number') return String(label);
    const str = String(label);
    const dateOnly = str.includes('T') ? str.split('T')[0] : str;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return dateOnly.slice(5);
    return str;
};

function generateFullTimeGroups(period) {
    if (period === '24h') {
        return Array.from({ length: 24 }, (_, i) => i);
    } else {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            days.push(`${mm}-${dd}`);
        }
        return days;
    }
}

export default function AdminChartsModal({ isOpen, onClose }) {
    const [ratingsDist, setRatingsDist] = useState([]);
    const [storeTimeSeries, setStoreTimeSeries] = useState([]);
    const [userTimeSeries, setUserTimeSeries] = useState([]);
    const [period, setPeriod] = useState('24h');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { theme } = useContext(ThemeContext);
    const { language } = useContext(LanguageContext);
    const t = translations[language];
    const isDark = theme === 'dark';

    useEffect(() => {
        if (!isOpen) return;
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const ratingsRes = await fetch(`${API_URL}/admin/charts/ratings-distribution`);
                if (!ratingsRes.ok) throw new Error(`${t.errorCode} ${ratingsRes.status}`);
                const ratingsData = await ratingsRes.json();
                setRatingsDist(Array.isArray(ratingsData) ? ratingsData : []);

                const storeRes = await fetch(`${API_URL}/admin/charts/store-views-time-series?period=${period}`);
                if (!storeRes.ok) throw new Error(`${t.errorCode} ${storeRes.status}`);
                const storeData = await storeRes.json();
                setStoreTimeSeries(Array.isArray(storeData) ? storeData : []);

                const userRes = await fetch(`${API_URL}/admin/charts/user-views-time-series?period=${period}`);
                if (!userRes.ok) throw new Error(`${t.errorCode} ${userRes.status}`);
                const userData = await userRes.json();
                setUserTimeSeries(Array.isArray(userData) ? userData : []);
            } catch (err) {
                setError(err.message || t.adminChartsLoadError);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isOpen, period]);

    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    const pieData = useMemo(() => {
        const safe = Array.isArray(ratingsDist) ? ratingsDist : [];
        return {
            labels: safe.map(r => r.rating_range || t.unknown),
            datasets: [{ data: safe.map(r => r.count || 0), backgroundColor: chartColors, borderWidth: 1 }]
        };
    }, [ratingsDist, language]);

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'right', labels: { color: textColor, boxWidth: 12 } },
            title: { display: true, text: '', color: textColor }
        }
    };

    const buildLineData = (timeSeries, nameKey) => {
        const safe = Array.isArray(timeSeries) ? timeSeries : [];
        const fullGroups = generateFullTimeGroups(period);
        const names = [...new Set(safe.map(item => item[nameKey]))];

        const datasets = names.map((name, index) => ({
            label: name,
            data: fullGroups.map(slot => {
                const match = safe.find(s =>
                    s[nameKey] === name &&
                    formatTimeLabel(s.time_group) === String(slot)
                );
                return match ? match.view_count : 0;
            }),
            borderColor: chartColors[index % chartColors.length],
            backgroundColor: chartColors[index % chartColors.length] + '1A',
            tension: 0,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
        }));

        return { labels: fullGroups.map(String), datasets };
    };

    const storeLineData = useMemo(
        () => buildLineData(storeTimeSeries, 'store_name'),
        [storeTimeSeries, period]
    );
    const userLineData = useMemo(
        () => buildLineData(userTimeSeries, 'username'),
        [userTimeSeries, period]
    );

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, color: textColor } },
            title: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: t.viewsCount, color: textColor },
                ticks: { color: textColor, precision: 0 },
                grid: { color: gridColor }
            },
            x: {
                title: {
                    display: true,
                    // Використовуємо рядок "Дні" / "Days" напряму для 7d
                    text: period === '24h'
                        ? String(t.hoursOfDay || 'Hours')
                        : (language === 'uk' ? 'Дні' : 'Days'),
                    color: textColor
                },
                ticks: { color: textColor },
                grid: { color: gridColor }
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className={`rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col relative overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>

                <button onClick={onClose}
                    className={`absolute top-4 right-4 z-[1000] p-3 rounded-full shadow-lg transition-all duration-200 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-900'
                        }`}
                    title={t.close}>
                    <X size={28} className="stroke-current" />
                </button>

                <div className="p-6 overflow-y-auto flex-1">
                    <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                        {t.adminCharts}
                    </h2>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 size={48} className="animate-spin text-indigo-600" />
                        </div>
                    ) : error ? (
                        <div className={`border p-6 rounded-lg text-center ${isDark ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            <p className="font-bold mb-2">{t.adminChartsLoadError}</p>
                            <p>{error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Перемикач періоду */}
                            <div className="flex justify-center mb-8">
                                <div className="inline-flex rounded-md shadow-sm">
                                    {['24h', '7d'].map((p, i) => (
                                        <button key={p} onClick={() => setPeriod(p)}
                                            className={`px-6 py-2 text-sm font-medium border ${i === 0 ? 'rounded-l-lg' : 'rounded-r-lg'
                                                } ${period === p
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : isDark
                                                        ? 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}>
                                            {p === '24h' ? t.period24h : t.period7d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Секторна діаграма */}
                            <div className="mb-12">
                                <h3 className={`text-xl font-semibold mb-4 text-center ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                    {t.ratingDistribution}
                                </h3>
                                <div className="h-96">
                                    {ratingsDist.length > 0
                                        ? <Pie data={pieData} options={pieOptions} />
                                        : <p className={`italic text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.noData}</p>
                                    }
                                </div>
                            </div>

                            {/* Лінійна — книгарні */}
                            <div className="mb-12">
                                <h3 className={`text-xl font-semibold mb-4 text-center ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                    {t.storeViewsOverTime}
                                </h3>
                                <div className="h-96">
                                    {storeTimeSeries.length > 0
                                        ? <Line data={storeLineData} options={lineOptions} />
                                        : <p className={`italic text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.noViewsForPeriod}</p>
                                    }
                                </div>
                            </div>

                            {/* Лінійна — користувачі */}
                            <div>
                                <h3 className={`text-xl font-semibold mb-4 text-center ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                    {t.userViewsOverTime}
                                </h3>
                                <div className="h-96">
                                    {userTimeSeries.length > 0
                                        ? <Line data={userLineData} options={lineOptions} />
                                        : <p className={`italic text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.noUserViewsForPeriod}</p>
                                    }
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}