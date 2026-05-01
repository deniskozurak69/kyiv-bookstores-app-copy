require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use('/guide.pdf', express.static(path.join(__dirname, 'guide.pdf')));

const LOG_FILE = path.join(__dirname, 'activity_log.json');

function logActivity(event, username = 'system', userId = null) {
    const entry = {
        event,
        user: username,
        user_id: userId !== null ? String(userId) : null,
        time: new Date().toISOString().replace('T', ' ').replace('Z', ''),
    };

    let logs = [];
    try {
        if (fs.existsSync(LOG_FILE)) {
            const content = fs.readFileSync(LOG_FILE, 'utf-8');
            logs = JSON.parse(content);
        }
    } catch { logs = []; }

    logs.push(entry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    console.log(`[LOG] ${entry.event} | user: ${entry.user} | time: ${entry.time}`);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
});

async function initDatabase() {
    try {
        await pool.query('SELECT 1');
        console.log('✅ Підключено до PostgreSQL');
        await createTables();
    } catch (err) {
        console.error('❌ Помилка підключення до бази даних:', err);
    }
}

async function createTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Bookstores (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                address VARCHAR(500) NOT NULL,
                hours VARCHAR(100) NOT NULL,
                latitude DECIMAL(10, 6),
                longitude DECIMAL(10, 6),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Departments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS BookstoreDepartments (
                bookstore_id INT NOT NULL REFERENCES Bookstores(id) ON DELETE CASCADE,
                department_id INT NOT NULL REFERENCES Departments(id) ON DELETE CASCADE,
                PRIMARY KEY (bookstore_id, department_id)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Ratings (
                id SERIAL PRIMARY KEY,
                store_id INT NOT NULL REFERENCES Bookstores(id) ON DELETE CASCADE,
                username VARCHAR(100) NOT NULL,
                rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
                created_at TIMESTAMP DEFAULT NOW(),
                CONSTRAINT uq_rating_store_user UNIQUE (store_id, username)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Comments (
                id SERIAL PRIMARY KEY,
                store_id INT NOT NULL REFERENCES Bookstores(id) ON DELETE CASCADE,
                username VARCHAR(100) NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                deleted_at TIMESTAMP NULL,
                deletion_reason VARCHAR(500) NULL,
                deleted_by VARCHAR(100) NULL
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Views (
                id SERIAL PRIMARY KEY,
                storeid INT NOT NULL REFERENCES Bookstores(id) ON DELETE CASCADE,
                userid INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
                viewedat TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS UserFavorites (
                userid INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
                storeid INT NOT NULL REFERENCES Bookstores(id) ON DELETE CASCADE,
                PRIMARY KEY (userid, storeid)
            )
        `);

        const deptCount = await pool.query('SELECT COUNT(*) as count FROM Departments');
        if (parseInt(deptCount.rows[0].count) === 0) {
            const departments = [
                'Художня література', 'Наукова література', 'Дитяча література',
                'Бізнес', 'Поезія', 'Українська класика', 'Іноземні мови',
                'Канцтовари', 'Подарункові видання'
            ];
            for (const dept of departments) {
                await pool.query('INSERT INTO Departments (name) VALUES ($1)', [dept]);
            }
            console.log('✅ Додано базові відділи');
        }

        const storeCount = await pool.query('SELECT COUNT(*) as count FROM Bookstores');
        if (parseInt(storeCount.rows[0].count) === 0) {
            await insertSampleData();
        }

        console.log('✅ Таблиці створено / перевірені');
    } catch (err) {
        console.error('❌ Помилка створення таблиць:', err);
    }
}

async function insertSampleData() {
    try {
        const sampleStores = [
            {
                name: 'Книгарня "Є"', address: 'вул. Лисенка, 3', hours: '10:00 - 21:00', lat: 50.4501, lng: 30.5234,
                depts: ['Художня література', 'Наукова література', 'Дитяча література', 'Канцтовари']
            },
            {
                name: 'Yakaboo', address: 'вул. Велика Васильківська, 15', hours: '09:00 - 20:00', lat: 50.4362, lng: 30.5186,
                depts: ['Художня література', 'Бізнес', 'Дитяча література', 'Іноземні мови']
            },
            {
                name: 'Книгарня "Сяйво"', address: 'Бульвар Тараса Шевченка, 36', hours: '10:00 - 19:00', lat: 50.4447, lng: 30.5038,
                depts: ['Художня література', 'Поезія', 'Українська класика']
            },
            {
                name: 'Book Ye', address: 'вул. Хрещатик, 44', hours: '10:00 - 21:00', lat: 50.4477, lng: 30.5236,
                depts: ['Художня література', 'Наукова література', 'Подарункові видання', 'Канцтовари']
            }
        ];

        for (const store of sampleStores) {
            const result = await pool.query(
                `INSERT INTO Bookstores (name, address, hours, latitude, longitude)
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [store.name, store.address, store.hours, store.lat, store.lng]
            );
            const bookstoreId = result.rows[0].id;

            for (const deptName of store.depts) {
                const dept = await pool.query('SELECT id FROM Departments WHERE name = $1', [deptName]);
                if (dept.rows.length > 0) {
                    await pool.query(
                        'INSERT INTO BookstoreDepartments (bookstore_id, department_id) VALUES ($1, $2)',
                        [bookstoreId, dept.rows[0].id]
                    );
                }
            }
        }
        console.log('✅ Додано тестові книгарні');
    } catch (err) {
        console.error('❌ Помилка додавання тестових даних:', err);
    }
}

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Логін та пароль обов\'язкові' });
        if (username.length < 3) return res.status(400).json({ error: 'Логін мінімум 3 символи' });
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const digitCount = (password.match(/\d/g) || []).length;
        if (!hasUpper || !hasLower || digitCount < 8) {
            return res.status(400).json({ error: 'Пароль не відповідає вимогам' });
        }
        const exists = await pool.query('SELECT id FROM Users WHERE username = $1', [username]);
        if (exists.rows.length > 0) {
            return res.status(409).json({ error: 'Такий логін вже зайнятий' });
        }
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO Users (username, password_hash) VALUES ($1, $2) RETURNING id',
            [username, hash]
        );
        logActivity(`РЕЄСТРАЦІЯ УСПІШНА: ${username} (ID ${result.rows[0].id})`);
        res.status(201).json({
            userId: result.rows[0].id,
            username,
            isAdmin: username.toLowerCase() === 'admin'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка сервера при реєстрації' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Логін та пароль обов\'язкові' });
        const result = await pool.query(
            'SELECT id, username, password_hash FROM Users WHERE username = $1',
            [username]
        );
        if (result.rows.length === 0) {
            logActivity(`НЕВДАЛИЙ ВХІД: ${username} — користувача не знайдено`);
            return res.status(401).json({ error: 'Невірний логін або пароль' });
        }
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            logActivity(`НЕВДАЛИЙ ВХІД: ${username} — невірний пароль`);
            return res.status(401).json({ error: 'Невірний логін або пароль' });
        }
        logActivity(`ВХІД УСПІШНИЙ: ${username} (ID ${user.id})`);
        res.json({
            userId: user.id,
            username: user.username,
            isAdmin: user.username.toLowerCase() === 'admin'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка сервера при вході' });
    }
});

app.post('/api/log/event', (req, res) => {
    const { username, userId, event, details } = req.body;
    if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: 'Відсутній або невалідний username' });
    }
    if (!event || typeof event !== 'string') {
        return res.status(400).json({ error: 'event повинен бути рядком' });
    }
    const detailStr = details && typeof details === 'object'
        ? ' ' + JSON.stringify(details)
        : '';
    logActivity(`${event.toUpperCase()}${detailStr}`, username, userId || null);
    res.status(204).send();
});

app.post('/api/auth/logs', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username || username.toLowerCase() !== 'admin') {
            return res.status(403).json({ error: 'Доступ дозволено лише адміністратору' });
        }
        if (!fs.existsSync(LOG_FILE)) return res.json({ logs: [] });
        const content = fs.readFileSync(LOG_FILE, 'utf-8');
        const logs = JSON.parse(content);
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: 'Помилка читання логів' });
    }
});

app.delete('/api/auth/logs', (req, res) => {
    try {
        const { username } = req.body;
        if (!username || username.toLowerCase() !== 'admin') {
            return res.status(403).json({ error: 'Доступ дозволено лише адміністратору' });
        }
        fs.writeFileSync(LOG_FILE, '[]');
        logActivity('ЛОГИ ОЧИЩЕНО', username, null);
        res.json({ message: 'Логи очищено' });
    } catch (err) {
        res.status(500).json({ error: 'Помилка очищення логів' });
    }
});

app.delete('/api/auth/logs/:index', (req, res) => {
    const { username } = req.body;
    const index = parseInt(req.params.index, 10);
    if (!username || username.toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Доступ дозволено лише адміністратору' });
    }
    try {
        if (!fs.existsSync(LOG_FILE)) return res.status(404).json({ error: 'Файл логів не знайдено' });
        const logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
        if (index < 0 || index >= logs.length) return res.status(404).json({ error: 'Лог не існує' });
        logs.splice(index, 1);
        fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
        logActivity(`ВИДАЛЕНО ОДИН ЛОГ (індекс ${index})`, username, null);
        res.json({ message: 'Лог успішно видалено' });
    } catch (err) {
        res.status(500).json({ error: 'Помилка видалення логу' });
    }
});

app.get('/api/departments', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM Departments ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка отримання відділів' });
    }
});

const { transliterate } = require('./utils/transliterate');

app.get('/api/bookstores', async (req, res) => {
    try {
        const { name, address, departments } = req.query;
        const values = [];
        let idx = 1;

        // Додаємо name_eng та address_eng у SELECT, щоб фронтенд їх бачив
        let query = `
            SELECT DISTINCT b.id, b.name, b.name_eng, b.address, b.address_eng, b.hours, b.latitude, b.longitude
            FROM Bookstores b
            LEFT JOIN BookstoreDepartments bd ON b.id = bd.bookstore_id
            LEFT JOIN Departments d ON bd.department_id = d.id
            WHERE 1=1
        `;

        // ПРАВИЛЬНИЙ ПОШУК ЗА НАЗВОЮ
        if (name) {
            const searchTerm = `%${name}%`;
            // Шукаємо в обох колонках (UA та ENG) без транслітерації
            query += ` AND (b.name ILIKE $${idx} OR b.name_eng ILIKE $${idx})`;
            values.push(searchTerm);
            idx += 1;
        }

        // ПРАВИЛЬНИЙ ПОШУК ЗА АДРЕСОЮ
        if (address) {
            const searchAddr = `%${address}%`;
            query += ` AND (b.address ILIKE $${idx} OR b.address_eng ILIKE $${idx})`;
            values.push(searchAddr);
            idx += 1;
        }

        // Логіка фільтрації за департаментами (залишається без змін)
        let deptIds = [];
        if (departments) {
            const deptList = Array.isArray(departments) ? departments : [departments];
            for (const dname of deptList) {
                const r = await pool.query('SELECT id FROM Departments WHERE name = $1', [dname]);
                if (r.rows.length) deptIds.push(r.rows[0].id);
            }
        }

        if (deptIds.length > 0) {
            const placeholders = deptIds.map((_, i) => `$${idx + i}`).join(',');
            query += `
                AND b.id IN (
                    SELECT bookstore_id FROM BookstoreDepartments
                    WHERE department_id IN (${placeholders})
                    GROUP BY bookstore_id
                    HAVING COUNT(DISTINCT department_id) = ${deptIds.length}
                )
            `;
            deptIds.forEach(id => values.push(id));
            idx += deptIds.length;
        }

        const storesResult = await pool.query(query, values);

        let bookstores = await Promise.all(
            storesResult.rows.map(async (store) => {
                const depts = await pool.query(
                    `SELECT d.name FROM Departments d
                     JOIN BookstoreDepartments bd ON d.id = bd.department_id
                     WHERE bd.bookstore_id = $1`,
                    [store.id]
                );
                const ratingRes = await pool.query(
                    `SELECT AVG(rating) as avg FROM Ratings WHERE store_id = $1`,
                    [store.id]
                );
                return {
                    ...store,
                    departments: depts.rows.map(d => d.name),
                    averageRating: ratingRes.rows[0].avg
                        ? Number(parseFloat(ratingRes.rows[0].avg).toFixed(1))
                        : null
                };
            })
        );

        res.json(bookstores);
    } catch (err) {
        console.error('Помилка в /api/bookstores:', err);
        res.status(500).json({ error: 'Помилка отримання книгарень' });
    }
});

app.post('/api/bookstores', async (req, res) => {
    try {
        const { name, name_eng, address, address_eng, hours, latitude, longitude, departments, username } = req.body;
        if (!name || !address || !hours) {
            return res.status(400).json({ error: 'Обов\'язкові поля: назва, адреса, години роботи' });
        }
        const result = await pool.query(
            `INSERT INTO Bookstores (name, name_eng, address, address_eng, hours, latitude, longitude)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, name_eng || null, address, address_eng || null, hours, latitude || null, longitude || null]
        );
        const bookstore = result.rows[0];
        if (departments?.length) {
            for (const deptName of departments) {
                const d = await pool.query('SELECT id FROM Departments WHERE name = $1', [deptName]);
                if (d.rows.length) {
                    await pool.query(
                        'INSERT INTO BookstoreDepartments (bookstore_id, department_id) VALUES ($1, $2)',
                        [bookstore.id, d.rows[0].id]
                    );
                }
            }
        }
        logActivity(`ДОДАНО КНИГАРНЮ "${name}" (id ${bookstore.id}) користувачем ${username || 'невідомо'}`);
        res.status(201).json({ ...bookstore, departments: departments || [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка створення книгарні' });
    }
});

app.put('/api/bookstores/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, name_eng, address, address_eng, hours, latitude, longitude, departments, username } = req.body;
        await pool.query(
            `UPDATE Bookstores
             SET name = $1, name_eng = $2, address = $3, address_eng = $4,
                 hours = $5, latitude = $6, longitude = $7, updated_at = NOW()
             WHERE id = $8`,
            [name, name_eng || null, address, address_eng || null, hours, latitude || null, longitude || null, id]
        );
        await pool.query('DELETE FROM BookstoreDepartments WHERE bookstore_id = $1', [id]);
        if (departments?.length) {
            for (const deptName of departments) {
                const d = await pool.query('SELECT id FROM Departments WHERE name = $1', [deptName]);
                if (d.rows.length) {
                    await pool.query(
                        'INSERT INTO BookstoreDepartments (bookstore_id, department_id) VALUES ($1, $2)',
                        [id, d.rows[0].id]
                    );
                }
            }
        }
        logActivity(`ОНОВЛЕНО КНИГАРНЮ id=${id} "${name}" користувачем ${username || 'невідомо'}`);
        const updated = await pool.query('SELECT * FROM Bookstores WHERE id = $1', [id]);
        res.json({ ...updated.rows[0], departments: departments || [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка оновлення' });
    }
});

app.delete('/api/bookstores/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username } = req.body;
        await pool.query('DELETE FROM Bookstores WHERE id = $1', [id]);
        logActivity(`ВИДАЛЕНО КНИГАРНЮ id=${id} користувачем ${username || 'невідомо'}`);
        res.json({ message: 'Книгарню видалено' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка видалення' });
    }
});

app.post('/api/bookstores/:id/view', async (req, res) => {
    const storeId = req.params.id;
    const { userId } = req.body;
    if (!userId) return res.status(401).json({ error: 'Потрібна авторизація' });
    try {
        await pool.query(
            'INSERT INTO Views (storeid, userid, viewedat) VALUES ($1, $2, NOW())',
            [storeId, userId]
        );
        const countResult = await pool.query(
            'SELECT COUNT(*) as totalviews FROM Views WHERE storeid = $1',
            [storeId]
        );
        res.json({ success: true, views: parseInt(countResult.rows[0].totalviews) });
    } catch (err) {
        console.error('Помилка запису перегляду:', err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

app.get('/api/bookstores/:id/views', async (req, res) => {
    const storeId = req.params.id;
    try {
        const result = await pool.query(
            'SELECT COUNT(*) as totalviews FROM Views WHERE storeid = $1',
            [storeId]
        );
        res.json({ views: parseInt(result.rows[0].totalviews) });
    } catch (err) {
        console.error('Помилка отримання переглядів:', err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

app.get('/api/bookstores/:id/ratings', async (req, res) => {
    const storeId = req.params.id;
    try {
        const ratingsResult = await pool.query(
            'SELECT rating, username, created_at FROM Ratings WHERE store_id = $1',
            [storeId]
        );
        const commentsResult = await pool.query(
            `SELECT id, username, comment, created_at FROM Comments
             WHERE store_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
            [storeId]
        );
        const deletedCommentsResult = await pool.query(
            `SELECT id, username, comment, created_at, deleted_at, deletion_reason, deleted_by
             FROM Comments WHERE store_id = $1 AND deleted_at IS NOT NULL ORDER BY deleted_at DESC`,
            [storeId]
        );

        const ratings = ratingsResult.rows;
        const avg = ratings.length > 0
            ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
            : null;

        res.json({
            average: avg,
            count: ratings.length,
            ratings,
            comments: commentsResult.rows,
            deletedComments: deletedCommentsResult.rows
        });
    } catch (err) {
        console.error('Помилка отримання рейтингів/коментарів:', err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

app.post('/api/bookstores/:id/rate', async (req, res) => {
    const { username, rating } = req.body;
    const storeId = req.params.id;
    if (!username || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Невірні дані' });
    }
    try {
        await pool.query(
            `INSERT INTO Ratings (store_id, username, rating)
             VALUES ($1, $2, $3)
             ON CONFLICT (store_id, username) DO UPDATE SET rating = EXCLUDED.rating`,
            [storeId, username, rating]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Помилка при оцінці:', err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

app.post('/api/bookstores/:id/comment', async (req, res) => {
    const { username, comment } = req.body;
    const storeId = req.params.id;
    if (!username || !comment?.trim()) {
        return res.status(400).json({ error: 'Невірні дані' });
    }
    try {
        await pool.query(
            'INSERT INTO Comments (store_id, username, comment) VALUES ($1, $2, $3)',
            [storeId, username, comment.trim()]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Помилка при додаванні коментаря:', err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

app.delete('/api/bookstores/:id/comment/:commentId', async (req, res) => {
    const { username, reason } = req.body;
    const { id: storeId, commentId } = req.params;
    if (!username || username.toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Доступ тільки для адміністратора' });
    }
    if (!reason?.trim()) {
        return res.status(400).json({ error: 'Вкажіть причину видалення' });
    }
    try {
        await pool.query(
            `UPDATE Comments
             SET deleted_at = NOW(), deletion_reason = $1, deleted_by = $2
             WHERE id = $3 AND store_id = $4 AND deleted_at IS NULL`,
            [reason.trim(), username, commentId, storeId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Помилка видалення коментаря:', err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

app.post('/api/bookstores/:id/favorite', async (req, res) => {
    const storeId = req.params.id;
    const { userId, action } = req.body;
    if (!userId) return res.status(401).json({ error: 'Не авторизовано' });
    try {
        if (action === 'add') {
            await pool.query(
                `INSERT INTO UserFavorites (userid, storeid) VALUES ($1, $2)
                 ON CONFLICT (userid, storeid) DO NOTHING`,
                [userId, storeId]
            );
        } else if (action === 'remove') {
            await pool.query(
                'DELETE FROM UserFavorites WHERE userid = $1 AND storeid = $2',
                [userId, storeId]
            );
        }
        const result = await pool.query(
            'SELECT COUNT(*) as isfavorite FROM UserFavorites WHERE userid = $1 AND storeid = $2',
            [userId, storeId]
        );
        res.json({ isFavorite: parseInt(result.rows[0].isfavorite) > 0 });
    } catch (err) {
        console.error('Помилка у /favorite:', err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

app.get('/api/bookstores/:id/favorite', async (req, res) => {
    const storeId = parseInt(req.params.id);
    const { userId } = req.query;
    if (!userId || isNaN(parseInt(userId))) {
        return res.status(401).json({ error: 'Не авторизовано' });
    }
    if (isNaN(storeId)) {
        return res.status(400).json({ error: 'Невірний ID книгарні' });
    }
    try {
        const result = await pool.query(
            'SELECT COUNT(*) as isfavorite FROM UserFavorites WHERE userid = $1 AND storeid = $2',
            [parseInt(userId), storeId]
        );
        res.json({ isFavorite: parseInt(result.rows[0].isfavorite) > 0 });
    } catch (err) {
        console.error('Помилка в GET /favorite:', err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

app.get('/api/users/:userId/favorites', async (req, res) => {
    const userId = req.params.userId;
    try {
        const result = await pool.query(
            `SELECT b.* FROM Bookstores b
             INNER JOIN UserFavorites uf ON b.id = uf.storeid
             WHERE uf.userid = $1 ORDER BY b.name`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

app.get('/api/admin/charts/ratings-distribution', async (req, res) => {
    try {
        const result = await pool.query(`
            WITH RatedStores AS (
                SELECT b.id, AVG(r.rating) AS avg_rating
                FROM Bookstores b
                LEFT JOIN Ratings r ON b.id = r.store_id
                GROUP BY b.id
            ),
            Ranges AS (
                SELECT
                    CASE
                        WHEN avg_rating IS NULL THEN 'Без оцінок'
                        WHEN avg_rating < 1 THEN '0–1'
                        WHEN avg_rating < 2 THEN '1–2'
                        WHEN avg_rating < 3 THEN '2–3'
                        WHEN avg_rating < 4 THEN '3–4'
                        ELSE '4–5'
                    END AS rating_range
                FROM RatedStores
            )
            SELECT rating_range, COUNT(*) AS count
            FROM Ranges
            GROUP BY rating_range
            ORDER BY rating_range
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Помилка в ratings-distribution:', err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

app.get('/api/admin/charts/store-views', async (req, res) => {
    const { period = '24h' } = req.query;
    const interval = period === '7d' ? '7 days' : '24 hours';
    try {
        const result = await pool.query(`
            SELECT b.name, COUNT(v.id) AS view_count
            FROM Bookstores b
            LEFT JOIN Views v ON b.id = v.storeid
            WHERE v.viewedat >= NOW() - INTERVAL '${interval}'
            GROUP BY b.name
            ORDER BY view_count DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

app.get('/api/admin/charts/user-views', async (req, res) => {
    const { period = '24h' } = req.query;
    const interval = period === '7d' ? '7 days' : '24 hours';
    try {
        const result = await pool.query(`
            SELECT u.username, COUNT(v.id) AS view_count
            FROM Users u
            LEFT JOIN Views v ON u.id = v.userid
            WHERE v.viewedat >= NOW() - INTERVAL '${interval}'
            GROUP BY u.username
            ORDER BY view_count DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

app.get('/api/admin/charts/store-views-time-series', async (req, res) => {
    const { period = '24h' } = req.query;
    const interval = period === '7d' ? '7 days' : '24 hours';
    const groupBy = period === '7d'
        ? "DATE_TRUNC('day', viewedat)"
        : "DATE_TRUNC('hour', viewedat)";
    try {
        const result = await pool.query(`
            SELECT b.name AS store_name, ${groupBy} AS time_group, COUNT(v.id) AS view_count
            FROM Bookstores b
            LEFT JOIN Views v ON b.id = v.storeid
            WHERE v.viewedat >= NOW() - INTERVAL '${interval}'
            GROUP BY b.name, time_group
            ORDER BY b.name, time_group
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Помилка time-series store views:', err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

app.get('/api/admin/charts/user-views-time-series', async (req, res) => {
    const { period = '24h' } = req.query;
    const interval = period === '7d' ? '7 days' : '24 hours';
    const groupBy = period === '7d'
        ? "DATE_TRUNC('day', viewedat)"
        : "DATE_TRUNC('hour', viewedat)";
    try {
        const result = await pool.query(`
            SELECT u.username, ${groupBy} AS time_group, COUNT(v.id) AS view_count
            FROM Users u
            LEFT JOIN Views v ON u.id = v.userid
            WHERE v.viewedat >= NOW() - INTERVAL '${interval}'
            GROUP BY u.username, time_group
            ORDER BY u.username, time_group
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Помилка time-series user views:', err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

initDatabase().then(() => {
    const getLocalIP = () => {
        const ifaces = os.networkInterfaces();
        for (const name of Object.keys(ifaces)) {
            for (const iface of ifaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
                        return iface.address;
                    }
                }
            }
        }
        return 'localhost';
    };
    const localIP = getLocalIP();
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\nСервер запущено на порту ${PORT}`);
        console.log(`Локально: http://localhost:${PORT}`);
        console.log(`У мережі: http://${localIP}:${PORT}`);
        console.log(`Логи активності: ${LOG_FILE}\n`);
    });
}).catch(err => {
    console.error('Критична помилка запуску:', err);
});