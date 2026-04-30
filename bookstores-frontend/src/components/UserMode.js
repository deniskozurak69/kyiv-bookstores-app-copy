import React, { useState, useMemo, useContext } from 'react';
import { Search, MapPin, Clock, BarChart2, Bot } from 'lucide-react';
import BookstoresMap from './BookstoresMap';
import ChartsModal from './ChartsModal';
import AIAssistant from './AIAssistant';
import { useNavigate } from 'react-router-dom';
import { buildSearchIndex } from '../utils/searchIndex';
import { transliterate } from '../utils/transliterate';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { translations } from '../translations';

const DAY_ORDER = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

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
    if (!hoursStr) return false;
    const segments = hoursStr.split(';').map(s => s.trim()).filter(Boolean);
    for (const seg of segments) {
        const parsed = parseSegment(seg);
        if (!parsed) continue;
        const dayMatch = parsed.days.length === 0 || parsed.days.includes(dayOsm);
        if (!dayMatch) continue;
        if (filterFrom < parsed.close && parsed.open < filterTo) return true;
    }
    if (segments.length === 1) {
        const times = hoursStr.match(/\d{1,2}:\d{2}/g);
        if (times && times.length >= 2) {
            const open = timeToMinutes(times[0]);
            const close = timeToMinutes(times[times.length - 1]);
            if (open !== null && close !== null) {
                return filterFrom < close && open < filterTo;
            }
        }
    }
    return false;
}

function formatHours(hoursStr) {
    if (!hoursStr) return hoursStr;
    return hoursStr.split(';').map(s => s.trim()).filter(Boolean).join('\n');
}

export default function UserMode({
    searchName,
    searchAddress,
    selectedDepartments,
    allDepartments,
    bookstores,
    loading,
    handleSearchNameChange,
    handleSearchAddressChange,
    handleDepartmentToggle,
    setSelectedDepartments,
    favoriteStoreIds = []
}) {
    const navigate = useNavigate();
    const { theme } = useContext(ThemeContext);
    const { language } = useContext(LanguageContext);
    const t = translations[language];
    console.log('🔍 Перший store з масиву:', bookstores?.[0]);
    console.log('🌐 Поточна мова:', language);

    const DAYS = DAY_ORDER.map(osm => ({ osm, label: t.days[osm] }));

    const [showList, setShowList] = useState(true);
    const [showMap, setShowMap] = useState(false);
    const [userPosition, setUserPosition] = useState(null);
    const [showCharts, setShowCharts] = useState(false);
    const [onlyFavorites, setOnlyFavorites] = useState(false);
    const [showAI, setShowAI] = useState(false);

    const [filterDay, setFilterDay] = useState('');
    const [timeFrom, setTimeFrom] = useState('');
    const [timeTo, setTimeTo] = useState('');

    const [aiResults, setAiResults] = useState(null);
    const [aiSortType, setAiSortType] = useState(null);

    // Хелпери для локалізованих полів
    const storeName = (store) => language === 'en' && store.name_eng ? store.name_eng : store.name;
    const storeAddress = (store) => language === 'en' && store.address_eng ? store.address_eng : store.address;
    const deptLabel = (dept) => t.departmentNames?.[dept] || dept;

    const handleApplyFilters = ({ departments, filterDay: day, timeFrom: tf, timeTo: tt, sortedStores, sortType, userPosition: pos }) => {
        setSelectedDepartments(departments || []);
        setFilterDay(day || '');
        setTimeFrom(tf || '');
        setTimeTo(tt || '');
        setAiResults(sortedStores || null);
        setAiSortType(sortType || null);
        if (pos) setUserPosition(pos);
        setShowAI(false);
        setShowList(true);
    };

    const searchIndex = useMemo(() => {
        if (!bookstores?.length) return null;
        return buildSearchIndex(bookstores);
    }, [bookstores]);

    const bookstoresById = useMemo(() => {
        if (!bookstores?.length) return {};
        return Object.fromEntries(bookstores.map(s => [s.id, s]));
    }, [bookstores]);

    const filteredBookstores = useMemo(() => {
        if (aiResults !== null) return aiResults;
        if (loading || !bookstores?.length) return [];

        let result = bookstores;

        if (selectedDepartments.length > 0) {
            result = result.filter(store =>
                selectedDepartments.every(dept => store.departments?.includes(dept))
            );
        }

        const nameQuery = searchName.trim().toLowerCase();
        const addressQuery = searchAddress.trim().toLowerCase();

        if (nameQuery) {
            console.log(nameQuery);
            result = result.filter(store => {
                const nameUk = (store.name || '').toLowerCase();
                const nameEn = (store.name_eng || '').toLowerCase();
                const nameTranslit = transliterate(nameQuery).toLowerCase();
                console.log(nameTranslit);
                return nameUk.includes(nameQuery) || nameEn.includes(nameQuery) ||
                    nameUk.includes(nameTranslit) || nameEn.includes(nameTranslit);
            });
        }

        if (addressQuery) {
            result = result.filter(store => {
                const addrUk = (store.address || '').toLowerCase();
                const addrEn = (store.address_eng || '').toLowerCase();
                const addrTranslit = transliterate(addressQuery).toLowerCase();
                return addrUk.includes(addressQuery) || addrEn.includes(addressQuery) ||
                    addrUk.includes(addrTranslit) || addrEn.includes(addrTranslit);
            });
        }

        if (onlyFavorites) {
            if (!Array.isArray(favoriteStoreIds) || favoriteStoreIds.length === 0) return [];
            const favIdsSet = new Set(favoriteStoreIds.map(id => Number(id)));
            result = result.filter(store => favIdsSet.has(Number(store.id)));
        }

        if (filterDay && timeFrom && timeTo) {
            const from = timeToMinutes(timeFrom);
            const to = timeToMinutes(timeTo);
            if (from !== null && to !== null && from < to) {
                result = result.filter(store => storeWorksAt(store.hours, filterDay, from, to));
            }
        }

        return result;
    }, [
        aiResults, bookstores, searchName, searchAddress, selectedDepartments,
        searchIndex, bookstoresById, loading, onlyFavorites, favoriteStoreIds,
        filterDay, timeFrom, timeTo,
    ]);

    const timeFilterActive = filterDay && timeFrom && timeTo;
    const timeInvalid = timeFrom && timeTo && timeFrom >= timeTo;

    const inputClass = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors text-sm ${theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-400'
            : 'bg-white border-gray-300 text-gray-900'
        }`;

    return (
        <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark'
                ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100'
                : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-900'
            } p-4`}>
            <div className="space-y-4 max-w-7xl mx-auto">

                {/* Блок пошуку */}
                <div className={`rounded-xl shadow-lg p-4 space-y-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex justify-between items-center">
                        <h2 className={`text-lg font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                            <Search size={20} className="text-indigo-600" /> {t.search}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button onClick={() => { setAiResults(null); setShowAI(true); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${theme === 'dark'
                                        ? 'bg-indigo-700 text-white hover:bg-indigo-600'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}>
                                <Bot size={16} /> AI
                            </button>
                        </div>
                    </div>

                    {/* AI банер */}
                    {aiResults !== null && (
                        <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${theme === 'dark' ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}>
                            <span>
                                <Bot size={14} className="inline mr-1" />
                                {t.aiResults} ({aiResults.length}) · {t.aiSortType}: {aiSortType === 'distance' ? t.aiSortDistance : t.aiSortRating}
                            </span>
                            <button onClick={() => { setAiResults(null); setAiSortType(null); }}
                                className="text-xs underline hover:no-underline ml-2">
                                {t.resetAi}
                            </button>
                        </div>
                    )}

                    {/* Назва */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                            {t.searchName}
                        </label>
                        <input type="text" value={searchName} onChange={handleSearchNameChange}
                            placeholder={t.searchNamePlaceholder}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                }`}
                        />
                    </div>

                    {/* Адреса */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                            {t.searchAddress}
                        </label>
                        <input type="text" value={searchAddress} onChange={handleSearchAddressChange}
                            placeholder={t.searchAddressPlaceholder}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                }`}
                        />
                    </div>

                    {/* Фільтр за днем і часом */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                            <Clock size={15} className="inline mr-1 text-indigo-500" />
                            {t.worksAtDayTime}
                        </label>
                        <div className="flex gap-1 mb-2 flex-wrap">
                            {DAYS.map(d => (
                                <button key={d.osm}
                                    onClick={() => setFilterDay(filterDay === d.osm ? '' : d.osm)}
                                    className={`flex-1 min-w-[36px] py-2 text-xs font-medium rounded-lg transition-colors ${filterDay === d.osm
                                            ? 'bg-indigo-600 text-white'
                                            : theme === 'dark'
                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}>
                                    {d.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)}
                                className={inputClass} disabled={!filterDay} />
                            <span className={`text-sm shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>—</span>
                            <input type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)}
                                className={inputClass} disabled={!filterDay} />
                            {timeFilterActive && (
                                <button onClick={() => { setFilterDay(''); setTimeFrom(''); setTimeTo(''); }}
                                    className={`shrink-0 text-xs px-2 py-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}>✕</button>
                            )}
                        </div>
                        {!filterDay && (
                            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t.selectDayFirst}
                            </p>
                        )}
                        {timeInvalid && (
                            <p className="text-xs text-red-500 mt-1">{t.timeFromBeforeTo}</p>
                        )}
                        {timeFilterActive && !timeInvalid && (
                            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {DAYS.find(d => d.osm === filterDay)?.label}, {timeFrom}–{timeTo}
                            </p>
                        )}
                    </div>

                    {/* Лише улюблені */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={onlyFavorites}
                            onChange={() => setOnlyFavorites(!onlyFavorites)}
                            className={`w-5 h-5 rounded transition-colors ${theme === 'dark' ? 'text-indigo-400 bg-gray-700 border-gray-600' : 'text-indigo-600 bg-white border-gray-300'
                                }`} />
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                            {t.onlyFavorites}
                        </span>
                    </label>

                    {/* Відділи */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                            {t.departments}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                            {allDepartments.length > 0 ? allDepartments.map(dept => (
                                <label key={dept} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox"
                                        checked={selectedDepartments.includes(dept)}
                                        onChange={() => handleDepartmentToggle(dept)}
                                        className={`w-4 h-4 rounded transition-colors ${theme === 'dark' ? 'text-indigo-400 bg-gray-700 border-gray-600' : 'text-indigo-600 bg-white border-gray-300'
                                            }`} />
                                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                        {deptLabel(dept)}
                                    </span>
                                </label>
                            )) : (
                                <p className={`text-sm col-span-full ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t.loading}
                                </p>
                            )}
                        </div>
                        {selectedDepartments.length > 0 && (
                            <button onClick={() => setSelectedDepartments([])}
                                className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                                {t.resetFilters}
                            </button>
                        )}
                    </div>
                </div>

                {/* Список + кнопки */}
                <div className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                            {t.found}: {filteredBookstores.length}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {bookstores.some(s => s.latitude && s.longitude) && (
                                <button onClick={() => setShowMap(true)}
                                    className={`px-3 py-2 text-white rounded-lg transition flex items-center gap-1 text-sm ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'
                                        }`}>
                                    <MapPin size={16} /> {t.map}
                                </button>
                            )}
                            <button onClick={() => setShowCharts(true)}
                                className={`px-3 py-2 text-white rounded-lg transition flex items-center gap-1 text-sm ${theme === 'dark' ? 'bg-purple-700 hover:bg-purple-600' : 'bg-purple-600 hover:bg-purple-700'
                                    }`}>
                                <BarChart2 size={16} /> {t.charts}
                            </button>
                            <button onClick={() => setShowList(!showList)}
                                className={`px-3 py-2 rounded-lg transition text-sm ${theme === 'dark' ? 'bg-indigo-900 text-indigo-300 hover:bg-indigo-800' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                    }`}>
                                {showList ? t.hide : t.showList}
                            </button>
                        </div>
                    </div>

                    {showList && (
                        <div className="space-y-3 transition-all duration-300">
                            {loading ? (
                                <div className={`rounded-xl shadow-md p-10 text-center ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
                                    {t.loading}
                                </div>
                            ) : filteredBookstores.length === 0 ? (
                                <div className={`rounded-xl shadow-md p-10 text-center ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
                                    {t.noResults}
                                </div>
                            ) : (
                                filteredBookstores.map(store => (
                                    <div key={store.id}
                                        onClick={() => navigate(`/store/${store.id}`, { state: { userPosition } })}
                                        className={`rounded-xl shadow-md p-4 space-y-2 transition-all cursor-pointer active:scale-[0.98] ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-indigo-50 active:bg-indigo-100'
                                            }`}>
                                        <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                            {storeName(store)}
                                        </h3>
                                        <div className={`flex items-start gap-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                            <MapPin size={16} className="mt-0.5 text-indigo-500 flex-shrink-0" />
                                            <span className="text-sm">{storeAddress(store)}</span>
                                        </div>
                                        <div className={`flex items-start gap-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                                            <Clock size={16} className="mt-0.5 text-indigo-500 flex-shrink-0" />
                                            <span className="text-sm whitespace-pre-line">{formatHours(store.hours)}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {store.departments?.length > 0 ? (
                                                store.departments.map(d => (
                                                    <span key={d} className={`px-2 py-0.5 rounded-full text-xs ${theme === 'dark' ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                                                        }`}>
                                                        {deptLabel(d)}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {t.noDepartments}
                                                </span>
                                            )}
                                        </div>
                                        {store.latitude && store.longitude && (
                                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                📍 {parseFloat(store.latitude).toFixed(4)}, {parseFloat(store.longitude).toFixed(4)}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    <BookstoresMap bookstores={bookstores} isOpen={showMap}
                        onClose={() => setShowMap(false)} setUserPosition={setUserPosition} />
                    <ChartsModal isOpen={showCharts} onClose={() => setShowCharts(false)}
                        bookstores={bookstores} userPosition={userPosition} />
                </div>
            </div>

            <AIAssistant
                isOpen={showAI}
                onClose={() => setShowAI(false)}
                bookstores={bookstores}
                onApplyFilters={handleApplyFilters}
            />
        </div>
    );
}