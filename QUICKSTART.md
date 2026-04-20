# ⚡ Швидкий старт

## 📌 Крок за кроком

### 1️⃣ Підготовка бази даних (5 хвилин)

1. Відкрийте **SQL Server Management Studio (SSMS)**
2. Підключіться до вашого SQL Server
3. Відкрийте файл `database-setup.sql`
4. Натисніть **F5** або кнопку **Execute**
5. Перевірте що створилася база `KyivBookstores`

### 2️⃣ Налаштування backend (3 хвилини)

1. Відкрийте термінал в папці проекту:
```bash
npm install
```

2. Створіть файл `.env` (скопіюйте з `.env.example`):
```bash
cp .env.example .env
```

3. Відредагуйте `.env` файл:
```env
DB_USER=sa
DB_PASSWORD=ваш_пароль
DB_SERVER=localhost
DB_NAME=KyivBookstores
DB_PORT=1433
PORT=3001
```

4. Запустіть сервер:
```bash
npm start
```

Ви побачите:
```
✅ Підключено до SQL Server
✅ Таблиці створено/перевірено
🚀 Сервер запущено на http://localhost:3001
```

### 3️⃣ Запуск frontend (2 хвилини)

**Варіант А: Швидкий тест (HTML файл)**

Створіть файл `index.html`:
```html
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Книгарні Києва</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel" src="frontend-app.jsx"></script>
</body>
</html>
```

Відкрийте `index.html` у браузері.

**Варіант Б: Create React App (рекомендовано)**

```bash
# Створіть новий React проект
npx create-react-app bookstores-frontend
cd bookstores-frontend

# Встановіть іконки
npm install lucide-react

# Скопіюйте код з frontend-app.jsx в src/App.js

# Запустіть
npm start
```

### 4️⃣ Перевірка роботи

1. Відкрийте застосунок у браузері
2. Спробуйте пошук книгарень
3. Переключіться на режим адміністратора
4. Спробуйте додати нову книгарню

## 🐛 Якщо щось не працює

### Backend не підключається до БД:
```bash
# Перевірте що SQL Server запущено
# Windows: Services -> SQL Server (MSSQLSERVER)

# Перевірте порт
netstat -an | findstr 1433

# Перевірте SQL Server Configuration Manager:
# - SQL Server Network Configuration
# - Protocols for MSSQLSERVER
# - TCP/IP має бути Enabled
```

### Frontend не підключається до API:
- Перевірте що backend запущено на порту 3001
- Перевірте консоль браузера на наявність CORS помилок
- Перевірте що `API_URL` в `frontend-app.jsx` правильний

### Помилка "Login failed":
- Перевірте логін та пароль в `.env`
- Переконайтесь що користувач має права на базу даних
- Для користувача `sa` переконайтесь що SQL Server Authentication увімкнена

## 📞 Додаткова допомога

Якщо виникли інші проблеми, перевірте детальну документацію в `README.md`
