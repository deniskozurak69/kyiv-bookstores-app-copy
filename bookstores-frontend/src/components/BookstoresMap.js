import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Navigation, Loader2, AlertCircle } from 'lucide-react';
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

export default function BookstoresMap({ bookstores, isOpen, onClose }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const routeLayerRef = useRef(null);
    const markersRef = useRef([]);
    const userMarkerRef = useRef(null);
    const { theme } = useContext(ThemeContext);
    const { language } = useContext(LanguageContext);
    const t = translations[language];

    const [userPosition, setUserPosition] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    // Хелпери для локалізованих полів
    const storeName = useCallback((store) =>
        language === 'en' && store.name_eng ? store.name_eng : store.name,
        [language]);

    const storeAddress = useCallback((store) =>
        language === 'en' && store.address_eng ? store.address_eng : store.address,
        [language]);

    const getLocation = useCallback(async () => {
        setIsLocating(true);
        setLocationError(null);

        try {
            const permResult = await Geolocation.requestPermissions();
            if (
                permResult.location !== 'granted' &&
                permResult.coarseLocation !== 'granted'
            ) {
                setLocationError(t.locationDenied);
                setIsLocating(false);
                return;
            }

            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 12000,
            });

            const { latitude, longitude } = position.coords;
            const posArray = [latitude, longitude];
            setUserPosition(posArray);
            setIsLocating(false);

            if (mapInstance.current) {
                if (userMarkerRef.current) {
                    mapInstance.current.removeLayer(userMarkerRef.current);
                }

                const userMarker = L.marker(posArray, {
                    icon: L.divIcon({
                        className: '',
                        html: `
                            <div style="
                                background: #2563eb;
                                color: white;
                                border-radius: 50%;
                                width: 40px;
                                height: 40px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                font-size: 14px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                                border: 3px solid white;
                            ">${t.youMarker}</div>
                        `,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20],
                        popupAnchor: [0, -25],
                    }),
                })
                    .addTo(mapInstance.current)
                    .bindPopup(t.yourCurrentLocation);

                userMarkerRef.current = userMarker;
                mapInstance.current.setView(posArray, 14, { animate: true, duration: 1 });
            }
        } catch (err) {
            setIsLocating(false);
            console.error('Помилка геолокації:', err);
            let msg = t.locationError;
            if (err.message?.includes('denied') || err.message?.includes('permission')) {
                msg = t.locationDenied;
            } else if (err.message?.includes('timeout')) {
                msg = t.locationTimeout;
            } else if (err.message?.includes('unavailable')) {
                msg = t.locationUnavailable;
            }
            setLocationError(msg);
        }
    }, [t]);

    const buildRoute = useCallback((storeLat, storeLng) => {
        if (!userPosition || !mapInstance.current) {
            alert(t.getLocationFirst);
            return;
        }

        if (routeLayerRef.current) {
            mapInstance.current.removeLayer(routeLayerRef.current);
            routeLayerRef.current = null;
        }

        const url = `https://router.project-osrm.org/route/v1/driving/${userPosition[1]},${userPosition[0]};${storeLng},${storeLat}?overview=full&geometries=geojson`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.code === 'Ok' && data.routes?.length > 0) {
                    const route = data.routes[0].geometry;
                    const layer = L.geoJSON(route, {
                        style: { color: '#3b82f6', weight: 6, opacity: 0.85 },
                    }).addTo(mapInstance.current);

                    routeLayerRef.current = layer;
                    mapInstance.current.fitBounds(layer.getBounds(), { padding: [60, 60] });
                } else {
                    alert(t.routeNotFound);
                }
            })
            .catch(err => {
                console.error('Помилка маршруту:', err);
                alert(t.routeError);
            });
    }, [userPosition, t]);

    useEffect(() => {
        if (isOpen) {
            getLocation();
        }
    }, [isOpen, getLocation]);

    useEffect(() => {
        if (!isOpen || !mapRef.current) return;

        if (!mapInstance.current) {
            mapInstance.current = L.map(mapRef.current, {
                zoomControl: true,
            }).setView([50.4501, 30.5234], 11);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(mapInstance.current);

            markersRef.current = [];
            bookstores.forEach((store) => {
                const lat = parseFloat(store.latitude);
                const lng = parseFloat(store.longitude);
                if (isNaN(lat) || isNaN(lng)) return;

                const marker = L.marker([lat, lng]).addTo(mapInstance.current);
                markersRef.current.push(marker);
            });

            mapInstance.current.on('popupopen', () => {
                mapInstance.current.invalidateSize();
            });
        }

        const t1 = setTimeout(() => mapInstance.current?.invalidateSize(), 100);
        const t2 = setTimeout(() => mapInstance.current?.invalidateSize(), 300);
        const t3 = setTimeout(() => mapInstance.current?.invalidateSize(), 600);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            if (!isOpen && mapInstance.current) {
                markersRef.current.forEach(m => m.remove());
                markersRef.current = [];

                if (routeLayerRef.current) {
                    mapInstance.current.removeLayer(routeLayerRef.current);
                    routeLayerRef.current = null;
                }

                if (userMarkerRef.current) {
                    mapInstance.current.removeLayer(userMarkerRef.current);
                    userMarkerRef.current = null;
                }

                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [isOpen, bookstores]);

    // Оновлення попапів при зміні позиції, мови або bookstores
    useEffect(() => {
        if (!mapInstance.current || markersRef.current.length === 0) return;

        markersRef.current.forEach((marker, index) => {
            const store = bookstores[index];
            if (!store) return;

            const lat = parseFloat(store.latitude);
            const lng = parseFloat(store.longitude);

            marker.bindPopup(() => {
                const div = document.createElement('div');
                div.style.cssText = 'text-align:center; min-width:240px; padding:8px;';

                div.innerHTML = `
                    <b>${storeName(store) || t.bookstore}</b><br>
                    ${storeAddress(store) || '—'}<br>
                    ${store.hours || t.hoursNotSpecified}<br>
                    <small style="color:#6b7280">${t.coordinates}: ${lat.toFixed(5)}, ${lng.toFixed(5)}</small>
                    <br><br>
                `;

                const btn = document.createElement('button');
                btn.style.cssText = `
                    width: 100%; padding: 10px 16px; border-radius: 8px;
                    font-weight: 500; color: white; border: none; cursor: pointer;
                    background: ${userPosition ? '#2563eb' : '#9ca3af'};
                `;
                btn.textContent = userPosition ? t.buildRoute : t.waitingLocation;
                btn.disabled = !userPosition;

                if (userPosition) {
                    btn.addEventListener('click', () => buildRoute(lat, lng));
                }

                div.appendChild(btn);
                return div;
            }, {
                autoPan: true,
                autoPanPaddingTopLeft: L.point(20, 80),
                autoPanPaddingBottomRight: L.point(20, 80),
                maxWidth: 280,
            });
        });
    }, [userPosition, bookstores, buildRoute, t, storeName, storeAddress]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col relative overflow-hidden">
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 z-[1000] p-3 rounded-full shadow-lg transition-all duration-200 ${theme === 'dark'
                            ? 'bg-gray-800 hover:bg-gray-700 text-white'
                            : 'bg-white hover:bg-gray-100 text-gray-900'
                        }`}
                    title={t.closeMap}
                >
                    <X size={28} className="stroke-current" />
                </button>

                {locationError && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-5 py-3 rounded-lg shadow z-[1000] flex items-center gap-3">
                        <AlertCircle size={22} />
                        <span className="text-sm">{locationError}</span>
                    </div>
                )}

                <button
                    onClick={getLocation}
                    disabled={isLocating}
                    className={`absolute bottom-6 right-6 z-[1000] px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 font-medium text-white transition-all ${isLocating ? 'bg-gray-500 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                        }`}
                >
                    {isLocating ? (
                        <><Loader2 size={22} className="animate-spin" />{t.gettingLocation}</>
                    ) : (
                        <><Navigation size={22} />{t.myLocation}</>
                    )}
                </button>

                <div ref={mapRef} className="flex-1 w-full" />
            </div>
        </div>
    );
}