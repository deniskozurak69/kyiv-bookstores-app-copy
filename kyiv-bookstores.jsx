import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Plus, Edit2, Trash2, Save, X, User, Shield } from 'lucide-react';

const KyivBookstoresApp = () => {
  const [mode, setMode] = useState('user'); // 'user' or 'admin'
  const [bookstores, setBookstores] = useState([
    {
      id: 1,
      name: 'Книгарня "Є"',
      address: 'вул. Лисенка, 3',
      hours: '10:00 - 21:00',
      coordinates: { lat: 50.4501, lng: 30.5234 },
      departments: ['Художня література', 'Наукова література', 'Дитяча література', 'Канцтовари']
    },
    {
      id: 2,
      name: 'Книгарня Yakaboo',
      address: 'вул. Велика Васильківська, 15',
      hours: '09:00 - 20:00',
      coordinates: { lat: 50.4362, lng: 30.5186 },
      departments: ['Художня література', 'Бізнес', 'Дитяча література', 'Іноземні мови']
    },
    {
      id: 3,
      name: 'Книгарня "Сяйво"',
      address: 'Бульвар Тараса Шевченка, 36',
      hours: '10:00 - 19:00',
      coordinates: { lat: 50.4447, lng: 30.5038 },
      departments: ['Художня література', 'Поезія', 'Українська класика']
    },
    {
      id: 4,
      name: 'Book Ye',
      address: 'вул. Хрещатик, 44',
      hours: '10:00 - 21:00',
      coordinates: { lat: 50.4477, lng: 30.5236 },
      departments: ['Художня література', 'Наукова література', 'Подарункові видання', 'Канцтовари']
    }
  ]);

  const [searchName, setSearchName] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [editingStore, setEditingStore] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const allDepartments = [
    'Художня література',
    'Наукова література',
    'Дитяча література',
    'Бізнес',
    'Поезія',
    'Українська класика',
    'Іноземні мови',
    'Канцтовари',
    'Подарункові видання'
  ];

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    hours: '',
    coordinates: { lat: '', lng: '' },
    departments: []
  });

  const filteredBookstores = bookstores.filter(store => {
    const nameMatch = store.name.toLowerCase().includes(searchName.toLowerCase());
    const addressMatch = store.address.toLowerCase().includes(searchAddress.toLowerCase());
    const departmentsMatch = selectedDepartments.length === 0 || 
      selectedDepartments.every(dept => store.departments.includes(dept));
    
    return nameMatch && addressMatch && departmentsMatch;
  });

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
      coordinates: { lat: '', lng: '' },
      departments: []
    });
    setShowAddForm(false);
    setEditingStore(null);
  };

  const handleAdd = () => {
    if (formData.name && formData.address && formData.hours) {
      const newStore = {
        id: Date.now(),
        ...formData,
        coordinates: {
          lat: parseFloat(formData.coordinates.lat) || 0,
          lng: parseFloat(formData.coordinates.lng) || 0
        }
      };
      setBookstores([...bookstores, newStore]);
      resetForm();
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store.id);
    setFormData({
      name: store.name,
      address: store.address,
      hours: store.hours,
      coordinates: store.coordinates,
      departments: [...store.departments]
    });
    setShowAddForm(false);
  };

  const handleUpdate = () => {
    setBookstores(bookstores.map(store =>
      store.id === editingStore
        ? {
            ...store,
            ...formData,
            coordinates: {
              lat: parseFloat(formData.coordinates.lat) || 0,
              lng: parseFloat(formData.coordinates.lng) || 0
            }
          }
        : store
    ));
    resetForm();
  };

  const handleDelete = (id) => {
    if (confirm('Ви впевнені, що хочете видалити цю книгарню?')) {
      setBookstores(bookstores.filter(store => store.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4">📚 Книгарні Києва</h1>
        
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('user')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              mode === 'user'
                ? 'bg-white text-indigo-600 font-semibold'
                : 'bg-indigo-500 text-white hover:bg-indigo-400'
            }`}
          >
            <User size={18} />
            Користувач
          </button>
          <button
            onClick={() => setMode('admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              mode === 'admin'
                ? 'bg-white text-indigo-600 font-semibold'
                : 'bg-indigo-500 text-white hover:bg-indigo-400'
            }`}
          >
            <Shield size={18} />
            Адміністратор
          </button>
        </div>
      </div>

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
                  {allDepartments.map(dept => (
                    <label key={dept} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDepartments.includes(dept)}
                        onChange={() => handleDepartmentToggle(dept)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{dept}</span>
                    </label>
                  ))}
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
                Знайдено: {filteredBookstores.length}
              </h3>
              {filteredBookstores.map(store => (
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
                      {store.departments.map(dept => (
                        <span
                          key={dept}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    📍 {store.coordinates.lat.toFixed(4)}, {store.coordinates.lng.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Admin Mode */
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
                      value={formData.coordinates.lat}
                      onChange={(e) => setFormData({
                        ...formData,
                        coordinates: { ...formData.coordinates, lat: e.target.value }
                      })}
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
                      value={formData.coordinates.lng}
                      onChange={(e) => setFormData({
                        ...formData,
                        coordinates: { ...formData.coordinates, lng: e.target.value }
                      })}
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
                    {allDepartments.map(dept => (
                      <label key={dept} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.departments.includes(dept)}
                          onChange={() => handleFormDepartmentToggle(dept)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={editingStore ? handleUpdate : handleAdd}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition"
                >
                  <Save size={20} />
                  {editingStore ? 'Зберегти зміни' : 'Додати книгарню'}
                </button>
              </div>
            )}

            {/* List of Bookstores */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Всі книгарні ({bookstores.length})
              </h3>
              {bookstores.map(store => (
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
                      {store.departments.map(dept => (
                        <span
                          key={dept}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KyivBookstoresApp;