# 📚 Книгарні Києва - Мобільний Застосунок

Повнофункціональний мобільний застосунок для управління інформацією про книгарні Києва з підключенням до Microsoft SQL Server 2022.

## 🎯 Функціонал

### 👤 Режим користувача:
- **Пошук за назвою** - введення тексту для пошуку книгарень за назвою
- **Пошук за адресою** - введення тексту для пошуку за адресою
- **Фільтрація за відділами** - вибір відділів через чек-бокси для знаходження книгарень з потрібними відділами
- **Перегляд результатів** - відображення знайдених книгарень з повною інформацією

### 🛡️ Режим адміністратора:
- **Додавання книгарень** - створення нових записів з усією необхідною інформацією
- **Редагування** - оновлення існуючих записів
- **Видалення** - видалення книгарень з бази даних
- **Управління відділами** - прив'язка відділів до книгарень

### 📊 Дані, що зберігаються:
- Назва книгарні
- Адреса
- Час роботи
- Координати (широта, довгота)
- Присутні відділи (багато-до-багатьох)

## 🏗️ Архітектура проекту

```
kyiv-bookstores/
├── server.js              # Backend API (Node.js + Express)
├── frontend-app.jsx       # Frontend (React)
├── database-setup.sql     # SQL скрипт для створення БД
├── package.json           # Залежності Node.js
└── README.md             # Документація
```

## 📋 Передумови

1. **Microsoft SQL Server 2022** (або новіше)
2. **Node.js** (версія 16 або новіше)
3. **npm** (зазвичай встановлюється разом з Node.js)

## 🚀 Встановлення та налаштування

### Крок 1: Налаштування бази даних

1. Запустіть **SQL Server Management Studio (SSMS)**

2. Виконайте скрипт `database-setup.sql`:
   ```sql
   -- Відкрийте файл database-setup.sql в SSMS
   -- Натисніть F5 або кнопку "Execute"
   ```

3. Перевірте створення бази даних:
   ```sql
   USE KyivBookstores;
   SELECT * FROM Bookstores;
   SELECT * FROM Departments;
   ```

### Крок 2: Налаштування Backend

1. **Встановіть залежності:**
   ```bash
   npm install
   ```

2. **Налаштуйте підключення до БД:**
   
   Відкрийте файл `server.js` та змініть конфігурацію (рядки 13-23):
   ```javascript
   const config = {
     user: 'ваше_ім_я_користувача',      // наприклад: 'sa'
     password: 'ваш_пароль',             // ваш пароль SQL Server
     server: 'localhost',                // або IP вашого сервера
     database: 'KyivBookstores',
     options: {
       encrypt: true,
       trustServerCertificate: true,
       enableArithAbort: true
     },
     port: 1433
   };
   ```

3. **Запустіть сервер:**
   ```bash
   npm start
   ```
   
   Ви побачите:
   ```
   ✅ Підключено до SQL Server
   ✅ Таблиці створено/перевірено
   🚀 Сервер запущено на http://localhost:3001
   ```

### Крок 3: Запуск Frontend

1. Frontend (`frontend-app.jsx`) є React компонентом, який можна інтегрувати в:
   - Create React App
   - Next.js
   - Vite
   - Або будь-який інший React фреймворк

2. **Приклад запуску з Create React App:**
   ```bash
   npx create-react-app kyiv-bookstores-frontend
   cd kyiv-bookstores-frontend
   npm install lucide-react
   ```

3. Замініть вміст `src/App.js` на код з `frontend-app.jsx`

4. Запустіть застосунок:
   ```bash
   npm start
   ```

## 🔌 API Endpoints

### GET `/api/departments`
Отримати всі доступні відділи

### GET `/api/bookstores`
Отримати всі книгарні з можливістю фільтрації

**Query параметри:**
- `name` - пошук за назвою
- `address` - пошук за адресою
- `departments` - фільтр за відділами (можна передавати кілька)

**Приклад:**
```
GET /api/bookstores?name=Є&departments=Художня література&departments=Канцтовари
```

### GET `/api/bookstores/:id`
Отримати конкретну книгарню за ID

### POST `/api/bookstores`
Створити нову книгарню

**Body:**
```json
{
  "name": "Назва книгарні",
  "address": "Адреса",
  "hours": "10:00 - 21:00",
  "latitude": 50.4501,
  "longitude": 30.5234,
  "departments": ["Художня література", "Канцтовари"]
}
```

### PUT `/api/bookstores/:id`
Оновити книгарню

### DELETE `/api/bookstores/:id`
Видалити книгарню

## 🗄️ Структура бази даних

### Таблиця `Bookstores`
```sql
id              INT PRIMARY KEY IDENTITY
name            NVARCHAR(255) NOT NULL
address         NVARCHAR(500) NOT NULL
hours           NVARCHAR(100) NOT NULL
latitude        DECIMAL(10, 6)
longitude       DECIMAL(10, 6)
created_at      DATETIME
updated_at      DATETIME
```

### Таблиця `Departments`
```sql
id              INT PRIMARY KEY IDENTITY
name            NVARCHAR(255) UNIQUE NOT NULL
```

### Таблиця `BookstoreDepartments`
```sql
bookstore_id    INT (FK -> Bookstores.id)
department_id   INT (FK -> Departments.id)
PRIMARY KEY (bookstore_id, department_id)
```

## 📱 Використання застосунку

### Режим користувача:
1. Введіть назву або адресу книгарні для пошуку
2. Оберіть потрібні відділи через чек-бокси
3. Переглядайте результати у реальному часі
4. Скиньте фільтри при потребі

### Режим адміністратора:
1. Натисніть кнопку "Додати нову книгарню"
2. Заповніть всі обов'язкові поля (назва, адреса, час роботи)
3. Додайте координати (опціонально)
4. Оберіть відділи які присутні в книгарні
5. Збережіть або відредагуйте існуючі записи
6. Видаліть записи при потребі (з підтвердженням)

## 🔧 Налаштування для Production

### Backend:
1. Змініть `trustServerCertificate` на `false` для production
2. Додайте змінні середовища для конфігурації:
   ```bash
   DB_USER=username
   DB_PASSWORD=password
   DB_SERVER=server_address
   DB_NAME=KyivBookstores
   ```

3. Використовуйте `.env` файл та `dotenv` пакет

### Frontend:
1. Змініть `API_URL` на production адресу
2. Додайте error boundary для обробки помилок
3. Оптимізуйте для мобільних пристроїв

## 🛠️ Можливі проблеми та рішення

### Помилка підключення до SQL Server:
- Переконайтесь що SQL Server запущено
- Перевірте що TCP/IP протокол увімкнено в SQL Server Configuration Manager
- Перевірте firewall правила для порту 1433
- Переконайтесь в правильності логіну та паролю

### CORS помилки:
- Backend вже налаштовано з `cors()` middleware
- Якщо проблеми залишаються, додайте специфічні origins в конфігурацію

### Помилка "Network request failed":
- Переконайтесь що backend запущено на порту 3001
- Перевірте що `API_URL` в frontend вказує на правильну адресу

## 📝 Ліцензія

ISC

## 👨‍💻 Автор

Застосунок створено для управління книгарнями Києва

## 🙏 Подяки

- React та lucide-react за компоненти
- Express.js за простий backend framework
- Microsoft SQL Server за надійну базу даних
- mssql пакет за чудову інтеграцію з Node.js
