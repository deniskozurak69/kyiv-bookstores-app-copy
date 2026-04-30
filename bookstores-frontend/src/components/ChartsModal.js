import React, { useMemo, useState, useEffect, useContext } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { X } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { translations } from '../translations';
import { Geolocation } from '@capacitor/geolocation';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ChartsModal({ isOpen, onClose, bookstores, userPosition }) {
    const [localUserPosition, setLocalUserPosition] = useState(userPosition || null);
    const { theme } = useContext(ThemeContext);
    const { language } = useContext(LanguageContext);
    const t = translations[language];
    const isDark = theme === 'dark';

    // Хелпер для локалізованої назви
    const storeName = (store) => language === 'en' && store.name_eng ? store.name_eng : store.name;

    useEffect(() => {
        if (!isOpen || localUserPosition) return;

        const getLocation = async () => {
            try {
                const perm = await Geolocation.requestPermissions();
                if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') return;
                const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
                setLocalUserPosition([pos.coords.latitude, pos.coords.longitude]);
            } catch (err) {
                console.warn('Геолокація недоступна:', err.message);
            }
        };

        getLocation();
    }, [isOpen]);

    const getDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const distanceData = useMemo(() => {
        const sorted = [...bookstores]
            .filter(s => s.latitude && s.longitude)
            .map(s => ({
                name: storeName(s),
                distance: localUserPosition
                    ? getDistance(localUserPosition[0], localUserPosition[1], s.latitude, s.longitude)
                    : Infinity
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10);

        return {
            labels: sorted.map(s => s.name),
            datasets: [{
                label: t.distanceKm,
                data: sorted.map(s => s.distance === Infinity ? 0 : Number(s.distance.toFixed(1))),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        };
    }, [bookstores, localUserPosition, language]);

    const ratingData = useMemo(() => {
        const sorted = [...bookstores]
            .filter(s => s.averageRating !== undefined && s.averageRating !== null)
            .sort((a, b) => b.averageRating - a.averageRating)
            .slice(0, 10);

        return {
            labels: sorted.map(s => storeName(s)),
            datasets: [{
                label: t.averageRating,
                data: sorted.map(s => s.averageRating || 0),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        };
    }, [bookstores, language]);

    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: textColor, boxWidth: 12 }
            },
            title: {
                display: true,
                text: t.topBookstores,
                color: textColor
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: textColor },
                grid: { color: gridColor }
            },
            x: {
                ticks: { color: textColor },
                grid: { color: gridColor }
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className={`rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col relative overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <button onClick={onClose}
                    className={`absolute top-4 right-4 z-[1000] p-3 rounded-full shadow-lg transition-all duration-200 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-900'
                        }`}
                    title={t.close}>
                    <X size={28} className="stroke-current" />
                </button>

                <div className="p-6 overflow-y-auto flex-1">
                    <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                        {t.bookstoreCharts}
                    </h2>

                    {/* Відстань */}
                    <div className="mb-12">
                        <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            {t.nearestBookstores} {localUserPosition ? t.fromYourLocation : t.detectingLocation}
                        </h3>
                        {localUserPosition ? (
                            <div className="h-80">
                                <Bar data={distanceData} options={{
                                    ...chartOptions,
                                    plugins: { ...chartOptions.plugins, title: { display: false } }
                                }} />
                            </div>
                        ) : (
                            <p className={`italic text-center py-10 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t.waitingGeolocation}
                            </p>
                        )}
                    </div>

                    {/* Рейтинг */}
                    <div>
                        <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            {t.highestRating}
                        </h3>
                        {ratingData.labels.length > 0 ? (
                            <div className="h-80">
                                <Bar data={ratingData} options={{
                                    ...chartOptions,
                                    plugins: { ...chartOptions.plugins, title: { display: false } }
                                }} />
                            </div>
                        ) : (
                            <p className={`italic text-center py-10 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t.noRatingData}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}