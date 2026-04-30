import React, { useState, useEffect, useContext } from 'react';
import { Plus, Sun, Moon } from 'lucide-react';
import { Routes, Route } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Header from './components/Header';
import LogsPanel from './components/LogsPanel';
import UserMode from './components/UserMode';
import AdminMode from './components/AdminMode';
import StoreDetail from './components/StoreDetail';
import { API_URL, logClientEvent } from './utils/api';
import { ThemeContext } from './context/ThemeContext';
import { LanguageContext } from './context/LanguageContext';
import { translations } from './translations';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import UserGuide from './components/UserGuide';

const KyivBookstoresApp = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { language } = useContext(LanguageContext);
    const t = translations[language];

    // Authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    // Login/Register form
    const [authForm, setAuthForm] = useState({
        username: '',
        password: ''
    });
    const [authError, setAuthError] = useState('');

    // App state
    const [mode, setMode] = useState('user');
    const [bookstores, setBookstores] = useState([]);
    const [allDepartments, setAllDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Logs state
    const [showLogs, setShowLogs] = useState(false);
    const [logs, setLogs] = useState([]);

    // Filters
    const [searchName, setSearchName] = useState('');
    const [searchAddress, setSearchAddress] = useState('');
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [favoriteStoreIds, setFavoriteStoreIds] = useState([]);

    // Form / Edit state
    const [editingStore, setEditingStore] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        hours: '',
        latitude: '',
        longitude: '',
        departments: []
    });

    const fetchFavorites = async () => {
        try {
            const res = await fetch(`${API_URL}/users/${currentUser.userId}/favorites`);
            if (!res.ok) throw new Error('Не вдалося завантажити улюблені');
            const data = await res.json();
            const ids = data.map(store => Number(store.id));
            setFavoriteStoreIds(ids);
            console.log('Завантажені улюблені ID:', ids);
        } catch (err) {
            console.error('Помилка завантаження улюблених:', err);
            setFavoriteStoreIds([]);
        }
    };

    // Перевірка збереженої сесії
    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                setCurrentUser(user);
                setIsAuthenticated(true);
                setIsAdmin(user.isAdmin || false);
                if (!user.isAdmin) {
                    setMode('user');
                }
            } catch (e) {
                localStorage.removeItem('currentUser');
            }
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && currentUser?.userId) {
            fetchFavorites();
        } else {
            setFavoriteStoreIds([]);
        }
    }, [isAuthenticated, currentUser]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchDepartments();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchBookstores();
        }
    }, [searchName, searchAddress, selectedDepartments, isAuthenticated]);

    useEffect(() => {
        if (showLogs && isAdmin) {
            fetchLogs();
        }
    }, [showLogs]);

    // ========== AUTHENTICATION FUNCTIONS ==========
    const validatePassword = (password) => {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const digitCount = (password.match(/\d/g) || []).length;
        if (!hasUpperCase) return t.passwordNeedsUpper;
        if (!hasLowerCase) return t.passwordNeedsLower;
        if (digitCount < 8) return t.passwordNeedsDigits;
        return null;
    };

    const handleLogin = async () => {
        setAuthError('');
        if (!authForm.username || !authForm.password) {
            setAuthError(t.fillAllFields);
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: authForm.username,
                    password: authForm.password
                })
            });
            const data = await response.json();
            if (response.ok) {
                const user = {
                    userId: data.userId,
                    username: data.username,
                    isAdmin: data.isAdmin
                };
                setCurrentUser(user);
                setIsAuthenticated(true);
                setIsAdmin(data.isAdmin);
                localStorage.setItem('currentUser', JSON.stringify(user));
                setAuthForm({ username: '', password: '' });
            } else {
                setAuthError(data.error || t.loginError);
            }
        } catch (err) {
            console.error('Помилка входу:', err);
            setAuthError(t.connectionError);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        setAuthError('');
        if (!authForm.username || !authForm.password) {
            setAuthError(t.fillAllFields);
            return;
        }
        if (authForm.username.length < 3) {
            setAuthError(t.usernameTooShort);
            return;
        }
        const passwordError = validatePassword(authForm.password);
        if (passwordError) {
            setAuthError(passwordError);
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: authForm.username,
                    password: authForm.password
                })
            });
            const data = await response.json();
            if (response.ok) {
                const user = {
                    userId: data.userId,
                    username: data.username,
                    isAdmin: data.isAdmin
                };
                setCurrentUser(user);
                setIsAuthenticated(true);
                setIsAdmin(data.isAdmin);
                localStorage.setItem('currentUser', JSON.stringify(user));
                setAuthForm({ username: '', password: '' });
                setShowRegister(false);
            } else {
                setAuthError(data.error || t.registerError);
            }
        } catch (err) {
            console.error('Помилка реєстрації:', err);
            setAuthError(t.connectionError);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logClientEvent(currentUser?.username, 'ВИХІД');
        setError(null);
        setLoading(false);
        setLogs([]);
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsAdmin(false);
        setMode('user');
        setShowLogs(false);
        setShowAddForm(false);
        setEditingStore(null);
        localStorage.removeItem('currentUser');
        setAuthForm({ username: '', password: '' });
    };

    // ========== LOGS FUNCTIONS ==========
    const fetchLogs = async () => {
        if (!isAuthenticated || !currentUser || !isAdmin) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/auth/logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser.username })
            });
            const data = await response.json();
            if (response.ok) {
                setLogs(data.logs || []);
            } else {
                setError(data.error || t.logsLoadError);
            }
        } catch (err) {
            console.error('Помилка завантаження логів:', err);
            if (isAuthenticated) {
                setError(t.connectionError);
            }
        } finally {
            if (isAuthenticated) {
                setLoading(false);
            }
        }
    };

    const downloadLogs = async () => {
        if (!logs || logs.length === 0) {
            alert(t.noLogsToDownload);
            return;
        }
        const date = new Date().toISOString().split('T')[0];

        if (Capacitor.isNativePlatform()) {
            try {
                const jsonContent = JSON.stringify(logs, null, 2);
                const fileName = `activity_${date}.json`;

                const directory = Capacitor.getPlatform() === 'android'
                    ? Directory.ExternalStorage
                    : Directory.Documents;

                const path = Capacitor.getPlatform() === 'android'
                    ? `Download/${fileName}`
                    : fileName;

                await Filesystem.writeFile({
                    path,
                    data: jsonContent,
                    directory,
                    encoding: 'utf8',
                    recursive: true,
                });

                alert(`${t.fileSaved}: ${fileName}`);
            } catch (err) {
                console.error('Помилка збереження:', err);
                alert(t.fileSaveError + ': ' + err.message);
            }
            return;
        }

        const jsonString = JSON.stringify(logs, null, 2);
        const fileName = `activity_${date}.json`;
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const clearLogs = async () => {
        if (!window.confirm(t.confirmClearLogs)) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/logs`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser.username })
            });
            const data = await response.json();
            if (response.ok) {
                setLogs([]);
                alert(t.logsCleared);
            } else {
                alert(data.error || t.logsClearError);
            }
        } catch (err) {
            console.error('Помилка очищення логів:', err);
            alert(t.connectionError);
        } finally {
            setLoading(false);
        }
    };

    // ========== BOOKSTORE FUNCTIONS ==========
    const fetchDepartments = async () => {
        try {
            const response = await fetch(`${API_URL}/departments`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            setAllDepartments(data.map(d => d.name));
        } catch (err) {
            console.error('Помилка завантаження відділів:', err);
            setAllDepartments([]);
        }
    };

    const fetchBookstores = async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (searchName) params.append('name', searchName);
            if (searchAddress) params.append('address', searchAddress);
            selectedDepartments.forEach(dept => params.append('departments', dept));
            const response = await fetch(`${API_URL}/bookstores?${params}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            logClientEvent(currentUser?.username, 'ПОШУК КНИГАРЕНЬ', {
                name: searchName || undefined,
                address: searchAddress || undefined,
                departments: selectedDepartments.length ? selectedDepartments : undefined,
                results: data?.length || 0
            });
            setBookstores(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Помилка завантаження книгарень:', err);
            if (isAuthenticated) {
                setError(t.bookstoresLoadError);
            }
        } finally {
            if (isAuthenticated) {
                setLoading(false);
            }
        }
    };

    const handleDepartmentToggle = (dept) => {
        setSelectedDepartments(prev => {
            const wasSelected = prev.includes(dept);
            const newSelected = wasSelected
                ? prev.filter(d => d !== dept)
                : [...prev, dept];
            logClientEvent(currentUser?.username, 'ЗМІНА ФІЛЬТРА ВІДДІЛ', {
                department: dept,
                action: wasSelected ? 'вимкнено' : 'увімкнено',
                now_selected_count: newSelected.length,
            });
            return newSelected;
        });
    };

    const handleFormDepartmentToggle = (dept) => {
        setFormData(prev => ({
            ...prev,
            departments: prev.departments.includes(dept)
                ? prev.departments.filter(d => d !== dept)
                : [...prev.departments, dept]
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            name_eng: '',
            address: '',
            address_eng: '',
            hours: '',
            latitude: '',
            longitude: '',
            departments: []
        });
        setShowAddForm(false);
        setEditingStore(null);
    };

    const validateForm = () => {
        if (!formData.name || !formData.address || !formData.hours) {
            alert(t.fillRequiredFields);
            return false;
        }
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);
        if (formData.latitude && (isNaN(lat) || lat < -90 || lat > 90)) {
            alert(t.invalidLatitude);
            return false;
        }
        if (formData.longitude && (isNaN(lng) || lng < -180 || lng > 180)) {
            alert(t.invalidLongitude);
            return false;
        }
        return true;
    };

    const handleAdd = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            const payload = {
                ...formData,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                username: currentUser?.username
            };
            console.log('📤 handleAdd payload:', JSON.stringify(payload, null, 2));

            const response = await fetch(`${API_URL}/bookstores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('📥 handleAdd response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ handleAdd result:', result);
                await fetchBookstores();
                resetForm();
                alert(t.bookstoreAdded);
            } else {
                const err = await response.json();
                console.error('❌ handleAdd error:', err);
                alert(err.error || t.bookstoreAddError);
            }
        } catch (err) {
            console.error('❌ handleAdd exception:', err);
            alert(t.connectionError);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (store) => {
        console.log('✏️ handleEdit store:', store);
        setEditingStore(store.id);
        setFormData({
            name: store.name,
            name_eng: store.name_eng || '',
            address: store.address,
            address_eng: store.address_eng || '',
            hours: store.hours,
            latitude: store.latitude || '',
            longitude: store.longitude || '',
            departments: [...(store.departments || [])]
        });
        setShowAddForm(false);
    };

    const handleUpdate = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            const payload = {
                ...formData,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                username: currentUser?.username
            };
            console.log('📤 handleUpdate payload:', JSON.stringify(payload, null, 2));

            const response = await fetch(`${API_URL}/bookstores/${editingStore}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('📥 handleUpdate response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ handleUpdate result:', result);
                await fetchBookstores();
                resetForm();
                alert(t.bookstoreUpdated);
            } else {
                const err = await response.json();
                console.error('❌ handleUpdate error:', err);
                alert(t.bookstoreUpdateError);
            }
        } catch (err) {
            console.error('❌ handleUpdate exception:', err);
            alert(t.connectionError);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t.confirmDeleteBookstore)) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/bookstores/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser?.username })
            });
            if (response.ok) {
                await fetchBookstores();
                alert(t.bookstoreDeleted);
            } else {
                alert(t.bookstoreDeleteError);
            }
        } catch (err) {
            console.error(err);
            alert(t.connectionError);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchNameChange = (e) => {
        const newValue = e.target.value;
        setSearchName(newValue);
        logClientEvent(currentUser?.username, 'ЗМІНА ФІЛЬТРА НАЗВА', {
            value: newValue.trim() || '(очищено)',
        });
    };

    const handleSearchAddressChange = (e) => {
        const newValue = e.target.value;
        setSearchAddress(newValue);
        logClientEvent(currentUser?.username, 'ЗМІНА ФІЛЬТРА АДРЕСА', {
            value: newValue.trim() || '(очищено)',
        });
    };

    // ========== RENDER ==========
    if (!isAuthenticated) {
        // Якщо користувач натиснув "Посібник", показуємо UserGuide
        if (showGuide) {
            return <UserGuide onBack={() => setShowGuide(false)} />;
        }

        // Інакше показуємо форму входу
        return (
            <AuthForm
                showRegister={showRegister}
                setShowRegister={setShowRegister}
                authForm={authForm}
                setAuthForm={setAuthForm}
                authError={authError}
                setAuthError={setAuthError}
                loading={loading}
                handleLogin={handleLogin}
                handleRegister={handleRegister}
                onKeyPress={e => e.key === 'Enter' && (showRegister ? handleRegister() : handleLogin())}
                onOpenGuide={() => setShowGuide(true)} // ПЕРЕДАЄМО ФУНКЦІЮ ВІДКРИТТЯ
            />
        );
    }

    if (showLogs && isAdmin) {
        return (
            <LogsPanel
                currentUser={currentUser}
                logs={logs}
                loading={loading}
                fetchLogs={fetchLogs}
                downloadLogs={downloadLogs}
                clearLogs={clearLogs}
                setShowLogs={setShowLogs}
                handleLogout={handleLogout}
            />
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100'
            : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-900'
            }`}>
            <Header
                currentUser={currentUser}
                isAdmin={isAdmin}
                mode={mode}
                setMode={setMode}
                setShowLogs={setShowLogs}
                fetchBookstores={fetchBookstores}
                handleLogout={handleLogout}
                toggleTheme={toggleTheme}
                theme={theme}
            />

            {error && (
                <div className={`m-4 p-4 rounded-lg border transition-colors ${theme === 'dark'
                    ? 'bg-red-900/50 border-red-700 text-red-200'
                    : 'bg-red-100 border-red-400 text-red-700'
                    }`}>
                    {error}
                </div>
            )}

            {loading && (
                <div className={`fixed inset-x-0 top-0 text-center py-2 z-50 transition-colors ${theme === 'dark' ? 'bg-indigo-800 text-white' : 'bg-indigo-600 text-white'
                    }`}>
                    {t.loading}
                </div>
            )}

            <div className="p-4">
                <Routes>
                    <Route
                        path="/"
                        element={
                            mode === 'user' ? (
                                <UserMode
                                    searchName={searchName}
                                    searchAddress={searchAddress}
                                    selectedDepartments={selectedDepartments}
                                    allDepartments={allDepartments}
                                    bookstores={bookstores}
                                    loading={loading}
                                    handleSearchNameChange={handleSearchNameChange}
                                    handleSearchAddressChange={handleSearchAddressChange}
                                    handleDepartmentToggle={handleDepartmentToggle}
                                    setSelectedDepartments={setSelectedDepartments}
                                    favoriteStoreIds={favoriteStoreIds}
                                />
                            ) : (
                                <AdminMode
                                    showAddForm={showAddForm}
                                    setShowAddForm={setShowAddForm}
                                    editingStore={editingStore}
                                    setEditingStore={setEditingStore}
                                    formData={formData}
                                    setFormData={setFormData}
                                    allDepartments={allDepartments}
                                    bookstores={bookstores}
                                    loading={loading}
                                    resetForm={resetForm}
                                    handleFormDepartmentToggle={handleFormDepartmentToggle}
                                    handleAdd={handleAdd}
                                    handleUpdate={handleUpdate}
                                    handleEdit={handleEdit}
                                    handleDelete={handleDelete}
                                />
                            )
                        }
                    />
                    <Route
                        path="/store/:id"
                        element={<StoreDetail bookstores={bookstores} currentUser={currentUser} refreshFavorites={fetchFavorites} />}
                    />
                </Routes>
            </div>
        </div>
    );
};

export default KyivBookstoresApp;