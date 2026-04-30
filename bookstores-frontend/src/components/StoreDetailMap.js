import React, { useState, useEffect, useRef, useContext } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Loader2, AlertCircle } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { translations } from '../translations';
import { Geolocation } from '@capacitor/geolocation';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default function StoreDetailMap({ store, userPosition }) {
    const { theme } = useContext(ThemeContext);
    const { language } = useContext(LanguageContext);
    const t = translations[language];
    const isDark = theme === 'dark';

    // Хелпери для локалізованих полів
    const storeName = language === 'en' && store?.name_eng ? store.name_eng : store?.name;
    const storeAddress = language === 'en' && store?.address_eng ? store.address_eng : store?.address;

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const routeLayerRef = useRef(null);
    const [localUserPosition, setLocalUserPosition] = useState(userPosition || null);
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState(null);

    const getLocation = async () => {
        setIsLocating(true);
        setLocationError(null);
        try {
            const perm = await Geolocation.requestPermissions();
            if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
                setLocationError(t.locationDenied);
                setIsLocating(false);
                return;
            }
            const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000 });
            setLocalUserPosition([pos.coords.latitude, pos.coords.longitude]);
            setIsLocating(false);
        } catch (err) {
            setIsLocating(false);
            let msg = t.locationError;
            if (err.message?.includes('denied') || err.message?.includes('permission')) {
                msg = t.locationDenied;
            } else if (err.message?.includes('timeout')) {
                msg = t.locationTimeout;
            }
            setLocationError(msg);
        }
    };

    useEffect(() => {
        if (!mapRef.current || !store?.latitude || !store?.longitude) return;

        mapInstance.current = L.map(mapRef.current).setView(
            [store.latitude, store.longitude], 15
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(mapInstance.current);

        // Використовуємо локалізовані назву та адресу в popup
        L.marker([store.latitude, store.longitude])
            .addTo(mapInstance.current)
            .bindPopup(`<b>${storeName}</b><br>${storeAddress}<br>${store.hours || t.hoursNotSpecified}`);

        if (localUserPosition) {
            buildRoute(localUserPosition, [store.latitude, store.longitude]);
        }

        const t1 = setTimeout(() => mapInstance.current?.invalidateSize(), 150);
        const t2 = setTimeout(() => mapInstance.current?.invalidateSize(), 400);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [store, language]); // language у залежностях — щоб popup оновлювався при зміні мови

    useEffect(() => {
        if (!mapInstance.current || !localUserPosition) return;
        buildRoute(localUserPosition, [store.latitude, store.longitude]);
    }, [localUserPosition, store]);

    const buildRoute = (startPos, endPos) => {
        if (!mapInstance.current) return;
        if (routeLayerRef.current) {
            mapInstance.current.removeLayer(routeLayerRef.current);
            routeLayerRef.current = null;
        }
        const [startLat, startLng] = startPos;
        const [endLat, endLng] = endPos;
        const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.code === 'Ok' && data.routes?.length > 0) {
                    const layer = L.geoJSON(data.routes[0].geometry, {
                        style: { color: '#3b82f6', weight: 6, opacity: 0.85 },
                    }).addTo(mapInstance.current);
                    routeLayerRef.current = layer;
                    mapInstance.current.fitBounds(layer.getBounds(), { padding: [80, 80] });
                }
            })
            .catch(err => console.error('Помилка маршруту:', err));
    };

    return (
        <div className="w-full rounded-xl overflow-hidden shadow-md">
            <div ref={mapRef} className="w-full h-72 md:h-96" />

            {locationError && (
                <div className={`flex items-center gap-2 px-4 py-3 text-sm ${isDark
                        ? 'bg-red-900/40 text-red-300 border-t border-red-700'
                        : 'bg-red-50 text-red-700 border-t border-red-200'
                    }`}>
                    <AlertCircle size={16} className="shrink-0" />
                    {locationError}
                </div>
            )}

            <button
                onClick={getLocation}
                disabled={isLocating}
                className={`w-full flex items-center justify-center gap-2 py-3 font-medium text-white transition-colors ${isLocating
                        ? 'bg-gray-500 cursor-wait'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                    }`}
            >
                {isLocating ? (
                    <><Loader2 size={20} className="animate-spin" />{t.gettingLocation}</>
                ) : (
                    <><Navigation size={20} />{t.buildRoute}</>
                )}
            </button>
        </div>
    );
}