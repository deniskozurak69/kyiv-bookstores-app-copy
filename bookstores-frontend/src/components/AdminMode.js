import React, { useState, useContext, useEffect, useRef } from 'react';
import { Plus, X, Save, Edit2, Trash2, MapPin, Clock, BarChart2, Map } from 'lucide-react';
import AdminChartsModal from './AdminChartsModal';
import BookstoresMap from './BookstoresMap';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { translations } from '../translations';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function formatHours(hoursStr) {
    if (!hoursStr) return hoursStr;
    return hoursStr.split(/[,;]/).map(s => s.trim()).filter(Boolean).join('\n');
}

// Міні-карта для вибору координат
function CoordPicker({ latitude, longitude, onChange, isDark, t }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRef = useRef(null);
    const [showMap, setShowMap] = useState(false);

    useEffect(() => {
        if (!showMap || !mapRef.current) return;

        const lat = parseFloat(latitude) || 50.4501;
        const lng = parseFloat(longitude) || 30.5234;

        if (!mapInstance.current) {
            mapInstance.current = L.map(mapRef.current).setView([lat, lng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap',
                maxZoom: 19,
            }).addTo(mapInstance.current);

            // Клік на карті — встановлює маркер і оновлює координати
            mapInstance.current.on('click', (e) => {
                const { lat, lng } = e.latlng;
                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                } else {
                    markerRef.current = L.marker([lat, lng]).addTo(mapInstance.current);
                }
                onChange(lat.toFixed(6), lng.toFixed(6));
            });
        }

        // Якщо вже є координати — показуємо маркер
        if (latitude && longitude) {
            const pos = [parseFloat(latitude), parseFloat(longitude)];
            if (markerRef.current) {
                markerRef.current.setLatLng(pos);
            } else {
                markerRef.current = L.marker(pos).addTo(mapInstance.current);
            }
            mapInstance.current.setView(pos, 15);
        }

        setTimeout(() => mapInstance.current?.invalidateSize(), 100);
        setTimeout(() => mapInstance.current?.invalidateSize(), 300);

        return () => {
            if (mapInstance.current && !showMap) {
                mapInstance.current.remove();
                mapInstance.current = null;
                markerRef.current = null;
            }
        };
    }, [showMap]);

    // Оновлюємо маркер коли змінюються координати ззовні
    useEffect(() => {
        if (!mapInstance.current || !latitude || !longitude) return;
        const pos = [parseFloat(latitude), parseFloat(longitude)];
        if (markerRef.current) {
            markerRef.current.setLatLng(pos);
        } else {
            markerRef.current = L.marker(pos).addTo(mapInstance.current);
        }
    }, [latitude, longitude]);

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t.coordinates}
                    {latitude && longitude && (
                        <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            ({parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)})
                        </span>
                    )}
                </span>
                <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition ${showMap
                            ? isDark ? 'bg-indigo-700 text-white' : 'bg-indigo-600 text-white'
                            : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    <Map size={13} />
                    {showMap ? t.hideMap : t.pickOnMap}
                </button>
            </div>

            {showMap && (
                <div className="mb-2">
                    <p className={`text-xs mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t.clickToSetMarker}
                    </p>
                    <div
                        ref={mapRef}
                        className="w-full h-56 rounded-lg overflow-hidden border"
                        style={{ borderColor: isDark ? '#4b5563' : '#d1d5db' }}
                    />
                </div>
            )}

            {/* Ручне введення як резервний варіант */}
            <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    placeholder={t.latitude + ' (50.4501)'}
                    onChange={e => onChange(e.target.value, longitude)}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                />
                <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    placeholder={t.longitude + ' (30.5234)'}
                    onChange={e => onChange(latitude, e.target.value)}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                />
            </div>
        </div>
    );
}

export default function AdminMode({
    showAddForm,
    setShowAddForm,
    editingStore,
    setEditingStore,
    formData,
    setFormData,
    allDepartments,
    bookstores,
    loading,
    resetForm,
    handleFormDepartmentToggle,
    handleAdd,
    handleUpdate,
    handleEdit,
    handleDelete
}) {
    const navigate = useNavigate();
    const { theme } = useContext(ThemeContext);
    const { language } = useContext(LanguageContext);
    const t = translations[language];
    const isDark = theme === 'dark';

    const [hoursError, setHoursError] = useState('');
    const [showList, setShowList] = useState(true);
    const [showMap, setShowMap] = useState(false);
    const [showAdminCharts, setShowAdminCharts] = useState(false);

    const storeName = (store) => language === 'en' && store.name_eng ? store.name_eng : store.name;
    const storeAddress = (store) => language === 'en' && store.address_eng ? store.address_eng : store.address;
    const deptLabel = (dept) => t.departmentNames?.[dept] || dept;

    const validateHours = (hoursStr) => {
        if (!hoursStr || hoursStr.trim() === '') return t.hoursRequired;
        const periods = hoursStr.split(/[,;]/).map(p => p.trim()).filter(Boolean);
        const dayRegex = /^(Mo|Tu|We|Th|Fr|Sa|Su)(-(Mo|Tu|We|Th|Fr|Sa|Su))*$/i;
        for (const period of periods) {
            const cleaned = period.trim();
            let timePart = cleaned;
            const dayMatch = cleaned.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))*)\s+(.+)$/i);
            if (dayMatch) {
                const days = dayMatch[1];
                timePart = dayMatch[2];
                if (!dayRegex.test(days)) return `${t.invalidDaysFormat}: "${days}". ${t.allowedDays}: Mo, Tu, We, Th, Fr, Sa, Su`;
            }
            const timeRegex = /^(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})$/;
            const match = timePart.match(timeRegex);
            if (!match) return `${t.invalidHoursFormat}: "${cleaned}". ${t.hoursExample}: 09:00 - 20:00 ${t.orExample} Mo-Fr 09:00-18:00`;
            const [, startH, startM, endH, endM] = match.map(Number);
            if (startH < 0 || startH > 23 || startM < 0 || startM > 59 ||
                endH < 0 || endH > 23 || endM < 0 || endM > 59) return t.timeRange;
            if (startH * 60 + startM > endH * 60 + endM) return t.startBeforeEnd;
        }
        return '';
    };

    const handleSubmit = () => {
        const error = validateHours(formData.hours);
        if (error) { setHoursError(error); return; }
        setHoursError('');
        if (editingStore) handleUpdate();
        else handleAdd();
    };

    const inputClass = `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
        }`;
    const labelClass = `block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

    return (
        <div className="space-y-6">
            {!showAddForm && !editingStore && (
                <button onClick={() => setShowAddForm(true)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl shadow-md hover:bg-green-700 transition">
                    <Plus size={20} /> {t.addBookstore}
                </button>
            )}

            {(showAddForm || editingStore) && (
                <div className={`rounded-xl shadow-md p-6 space-y-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex justify-between items-center">
                        <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            {editingStore ? t.editBookstoreTitle : t.addBookstoreTitle}
                        </h2>
                        <button onClick={resetForm} className={isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}>
                            <X size={24} />
                        </button>
                    </div>

                    {/* Назва укр */}
                    <div>
                        <label className={labelClass}>{t.nameUk} *</label>
                        <input type="text" value={formData.name}
                            placeholder={t.bookstoreNamePlaceholder}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className={inputClass} />
                    </div>

                    {/* Назва англ */}
                    <div>
                        <label className={labelClass}>{t.nameEn}</label>
                        <input type="text" value={formData.name_eng || ''}
                            placeholder={t.bookstoreNameEnPlaceholder}
                            onChange={e => setFormData({ ...formData, name_eng: e.target.value })}
                            className={inputClass} />
                    </div>

                    {/* Адреса укр */}
                    <div>
                        <label className={labelClass}>{t.addressUk} *</label>
                        <input type="text" value={formData.address}
                            placeholder={t.addressPlaceholder}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className={inputClass} />
                    </div>

                    {/* Адреса англ */}
                    <div>
                        <label className={labelClass}>{t.addressEn}</label>
                        <input type="text" value={formData.address_eng || ''}
                            placeholder={t.addressEnPlaceholder}
                            onChange={e => setFormData({ ...formData, address_eng: e.target.value })}
                            className={inputClass} />
                    </div>

                    {/* Години роботи */}
                    <div>
                        <label className={labelClass}>{t.hours} *</label>
                        <input type="text" value={formData.hours}
                            placeholder="Mo-Fr 09:00-20:00; Sa-Su 10:00 - 18:00"
                            onChange={e => {
                                setFormData({ ...formData, hours: e.target.value });
                                if (hoursError) setHoursError('');
                            }}
                            className={`${inputClass} ${hoursError ? 'border-red-500 focus:ring-red-500' : ''}`} />
                        {hoursError && <p className="mt-1 text-sm text-red-500 font-medium">{hoursError}</p>}
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t.hoursExamples}:<br />
                            • 09:00 - 20:00<br />
                            • Mo-Fr 09:00-20:00<br />
                            • Mo,Tu 08:00-18:00; Sa-Su 10:00 - 19:00
                        </p>
                    </div>

                    {/* Координати з картою */}
                    <CoordPicker
                        latitude={formData.latitude}
                        longitude={formData.longitude}
                        onChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                        isDark={isDark}
                        t={t}
                    />

                    {/* Відділи */}
                    <div>
                        <label className={labelClass}>{t.departments}</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                            {allDepartments.length > 0 ? (
                                allDepartments.map(dept => (
                                    <label key={dept} className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox"
                                            checked={formData.departments.includes(dept)}
                                            onChange={() => handleFormDepartmentToggle(dept)}
                                            className="w-4 h-4 text-indigo-600 rounded" />
                                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {deptLabel(dept)}
                                        </span>
                                    </label>
                                ))
                            ) : (
                                <p className={`text-sm col-span-full ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.loading}</p>
                            )}
                        </div>
                    </div>

                    {/* Кнопка збереження */}
                    <button onClick={handleSubmit} disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition">
                        <Save size={20} />
                        {editingStore ? t.saveChanges : t.addBookstore}
                    </button>
                </div>
            )}

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {t.allBookstores} ({bookstores.length})
                    </h3>
                    <button onClick={() => setShowList(!showList)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition ${isDark ? 'bg-indigo-900 text-indigo-300 hover:bg-indigo-800' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            }`}>
                        {showList ? t.hide : t.showList}
                    </button>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setShowAdminCharts(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                        <BarChart2 size={16} /> {t.charts}
                    </button>
                    {bookstores.some(s => s.latitude && s.longitude) && (
                        <button onClick={() => setShowMap(true)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            <MapPin size={16} /> {t.showMap}
                        </button>
                    )}
                </div>

                {showList && (
                    <div className="space-y-4 transition-all duration-300">
                        {bookstores.length === 0 ? (
                            <div className={`rounded-xl shadow-md p-10 text-center ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
                                {loading ? t.loading : t.noBookstoresYet}
                            </div>
                        ) : (
                            bookstores.map(store => (
                                <div key={store.id}
                                    onClick={() => navigate(`/store/${store.id}`)}
                                    className={`rounded-xl shadow-md p-5 cursor-pointer active:scale-[0.98] transition-all ${isDark
                                            ? 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600'
                                            : 'bg-white hover:bg-indigo-50 active:bg-indigo-100'
                                        }`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className={`text-xl font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                            {storeName(store)}
                                        </h3>
                                        <div className="flex gap-2">
                                            <button onClick={e => { e.stopPropagation(); handleEdit(store); }}
                                                className={`p-2 rounded transition ${isDark ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'}`}>
                                                <Edit2 size={20} />
                                            </button>
                                            <button onClick={e => { e.stopPropagation(); handleDelete(store.id); }}
                                                className={`p-2 rounded transition ${isDark ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}`}>
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <MapPin size={16} className={`mt-0.5 shrink-0 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {storeAddress(store)}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Clock size={16} className={`mt-0.5 shrink-0 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                                            <span className={`text-sm whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {formatHours(store.hours)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-1">
                                        {store.departments?.length > 0 ? (
                                            store.departments.map(d => (
                                                <span key={d} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                                                    }`}>
                                                    {deptLabel(d)}
                                                </span>
                                            ))
                                        ) : (
                                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {t.noDepartments}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <BookstoresMap bookstores={bookstores} isOpen={showMap} onClose={() => setShowMap(false)} />
                <AdminChartsModal isOpen={showAdminCharts} onClose={() => setShowAdminCharts(false)} />
            </div>
        </div>
    );
}
