import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Plus, Edit2, Trash2, Save, X, User, Shield, RefreshCw } from 'lucide-react';

// 📱 АВТОМАТИЧНЕ ВИЗНАЧЕННЯ API URL
// Працює як на localhost так і на мобільному
const getApiUrl = () => {
  const hostname = window.location.hostname;
  
  // Якщо відкрито на мобільному (по IP)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3001/api`;
  }
  
  // Якщо на комп'ютері
  return 'http://localhost:3001/api';
};

const API_URL = getApiUrl();

// Виведення URL для діагностики
console.log('🌐 API URL:', API_URL);
console.log('📍 Hostname:', window.location.hostname);

const KyivBookstoresApp = () => {
  const [mode, setMode] = useState('user');
  const [bookstores, setBookstores] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchName, setSearchName] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
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

  // Завантаження відділів при старті
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Завантаження книгарень при зміні фільтрів
  useEffect(() => {
    fetchBookstores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchName, searchAddress, selectedDepartments]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_URL}/departments`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Перевірка що data є масивом
      if (Array.isArray(data)) {
        setAllDepartments(data.map(d => d.name));
      } else {
        console.error('Отримані дані відділів не є масивом:', data);
        setAllDepartments([]);
      }
    } catch (err) {
      console.error('Помилка завантаження відділів:', err);
      setAllDepartments([]);
      setError('Не вдалося завантажити відділи. Переконайтесь що сервер запущено.');
    }
  };

  const fetchBookstores = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchName) params.append('name', searchName);
      if (searchAddress) params.append('address', searchAddress);
      selectedDepartments.forEach(dept => params.append('departments', dept));

      const response = await fetch(`${API_URL}/bookstores?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Перевірка що data є масивом
      if (Array.isArray(data)) {
        setBookstores(data);
      } else {
        console.error('Отримані дані не є масивом:', data);
        setBookstores([]);
        setError('Отримано некоректні дані від сервера');
      }
    } catch (err) {
      console.error('Помилка завантаження книгарень:', err);
      setBookstores([]);
      setError('Не вдалося завантажити книгарні. Переконайтесь що сервер запущено.');
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentToggle = (dept) => {
    setSelectedDepartments(prev =>
      prev.includes(dept)
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    );
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
      address: '',
      hours: '',
      latitude: '',
      longitude: '',
      departments: []
    });
    setShowAddForm(false);
    setEditingStore(null);
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.address || !formData.hours) {
      window.alert('Заповніть всі обов\'язкові поля!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/bookstores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          hours: formData.hours,
          latitude: parseFloat(formData.latitude) || null,
          longitude: parseFloat(formData.longitude) || null,
          departments: formData.departments
        }),
      });

      if (response.ok) {
        await fetchBookstores();
        resetForm();
        window.alert('Книгарню успішно додано!');
      } else {
        const error = await response.json();
        window.alert('Помилка: ' + (error.error || 'Не вдалося додати книгарню'));
      }
    } catch (err) {
      console.error('Помилка додавання:', err);
      window.alert('Помилка підключення до сервера');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store.id);
    setFormData({
      name: store.name,
      address: store.address,
      hours: store.hours,
      latitude: store.latitude || '',
      longitude: store.longitude || '',
      departments: [...store.departments]
    });
    setShowAddForm(false);
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.address || !formData.hours) {
      window.alert('Заповніть всі обов\'язкові поля!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/bookstores/${editingStore}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          hours: formData.hours,
          latitude: parseFloat(formData.latitude) || null,
          longitude: parseFloat(formData.longitude) || null,
          departments: formData.departments
        }),
      });

      if (response.ok) {
        await fetchBookstores();
        resetForm();
        window.alert('Книгарню успішно оновлено!');
      } else {
        window.alert('Не вдалося оновити книгарню');
      }
    } catch (err) {
      console.error('Помилка оновлення:', err);
      window.alert('Помилка підключення до сервера');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цю книгарню?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/bookstores/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchBookstores();
        window.alert('Книгарню видалено!');
      } else {
        window.alert('Не вдалося видалити книгарню');
      }
    } catch (err) {
      console.error('Помилка видалення:', err);
      window.alert('Помилка підключення до сервера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-2">📚 Книгарні Києва</h1>
        <p className="text-xs opacity-90 mb-4">
          📱 Мобільна версія | 🌐 {window.location.hostname}
        </p>
        
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={fetchBookstores}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 transition ml-auto"
          >
            <RefreshCw size={18} />
            Оновити
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="m-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 bg-indigo-600 text-white text-center py-2 z-50">
          Завантаження...
        </div>
      )}

      <div className="p-4">
        {mode === 'user' ? (
          /* User Mode - Search */
          <div className="space-y-4">
            {/* Search Section */}
            <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Search size={20} className="text-indigo-600" />
                Пошук книгарень
              </h2>

              {/* Name Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Назва книгарні
                </label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Введіть назву..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Address Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Адреса
                </label>
                <input
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="Введіть адресу..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Відділи (оберіть потрібні)
                </label>
                <div className="space-y-2">
                  {allDepartments && allDepartments.length > 0 ? (
                    allDepartments.map(dept => (
                      <label key={dept} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDepartments.includes(dept)}
                          onChange={() => handleDepartmentToggle(dept)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{dept}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Завантаження відділів...</p>
                  )}
                </div>
              </div>

              {selectedDepartments.length > 0 && (
                <button
                  onClick={() => setSelectedDepartments([])}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Скинути фільтри відділів
                </button>
              )}
            </div>

            {/* Results */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Знайдено: {bookstores ? bookstores.length : 0}
              </h3>
              {!bookstores || bookstores.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
                  {loading ? 'Завантаження...' : 'Книгарні не знайдено'}
                </div>
              ) : (
                bookstores.map(store => (
                  <div key={store.id} className="bg-white rounded-xl shadow-md p-4 space-y-2">
                    <h3 className="text-lg font-bold text-indigo-600">{store.name}</h3>
                    
                    <div className="flex items-start gap-2 text-gray-700">
                      <MapPin size={18} className="mt-1 text-indigo-500 flex-shrink-0" />
                      <span className="text-sm">{store.address}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock size={18} className="text-indigo-500 flex-shrink-0" />
                      <span className="text-sm">{store.hours}</span>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Відділи:</p>
                      <div className="flex flex-wrap gap-1">
                        {store.departments && store.departments.length > 0 ? (
                          store.departments.map(dept => (
                            <span
                              key={dept}
                              className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs"
                            >
                              {dept}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Немає відділів</span>
                        )}
                      </div>
                    </div>
                    
                    {store.latitude && store.longitude && (
                      <div className="text-xs text-gray-500 mt-2">
                        📍 {parseFloat(store.latitude).toFixed(4)}, {parseFloat(store.longitude).toFixed(4)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Admin Mode - остання частина така сама як у оригінальному файлі */
          <div className="space-y-4">
            {/* Add Button */}
            {!showAddForm && !editingStore && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl shadow-md hover:bg-green-700 transition"
              >
                <Plus size={20} />
                Додати нову книгарню
              </button>
            )}

            {/* Add/Edit Form */}
            {(showAddForm || editingStore) && (
              <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {editingStore ? 'Редагувати книгарню' : 'Додати нову книгарню'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Назва *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Назва книгарні"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Адреса *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Адреса"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Час роботи *
                  </label>
                  <input
                    type="text"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    placeholder="09:00 - 20:00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Широта
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="50.4501"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Довгота
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="30.5234"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Відділи (оберіть наявні)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {allDepartments && allDepartments.length > 0 ? (
                      allDepartments.map(dept => (
                        <label key={dept} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.departments.includes(dept)}
                            onChange={() => handleFormDepartmentToggle(dept)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{dept}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Завантаження відділів...</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={editingStore ? handleUpdate : handleAdd}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
                >
                  <Save size={20} />
                  {editingStore ? 'Зберегти зміни' : 'Додати книгарню'}
                </button>
              </div>
            )}

            {/* List of Bookstores */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Всі книгарні ({bookstores ? bookstores.length : 0})
              </h3>
              {!bookstores || bookstores.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
                  {loading ? 'Завантаження...' : 'Книгарні не знайдено'}
                </div>
              ) : (
                bookstores.map(store => (
                  <div key={store.id} className="bg-white rounded-xl shadow-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-indigo-600">{store.name}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(store)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(store.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-700">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="mt-0.5 text-indigo-500 flex-shrink-0" />
                        <span>{store.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-indigo-500 flex-shrink-0" />
                        <span>{store.hours}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {store.departments && store.departments.length > 0 ? (
                          store.departments.map(dept => (
                            <span
                              key={dept}
                              className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs"
                            >
                              {dept}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Немає відділів</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KyivBookstoresApp;
