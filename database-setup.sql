-- Скрипт створення бази даних для застосунку "Книгарні Києва"
-- Microsoft SQL Server 2022

-- Створення бази даних
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'KyivBookstores')
BEGIN
    CREATE DATABASE KyivBookstores;
END
GO

USE KyivBookstores;
GO

-- Таблиця книгарень
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Bookstores' AND xtype='U')
BEGIN
    CREATE TABLE Bookstores (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(255) NOT NULL,
        address NVARCHAR(500) NOT NULL,
        hours NVARCHAR(100) NOT NULL,
        latitude DECIMAL(10, 6),
        longitude DECIMAL(10, 6),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    
    PRINT 'Таблиця Bookstores створена';
END
GO

-- Таблиця відділів
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Departments' AND xtype='U')
BEGIN
    CREATE TABLE Departments (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(255) NOT NULL UNIQUE
    );
    
    PRINT 'Таблиця Departments створена';
END
GO

-- Таблиця зв'язку книгарень та відділів (багато-до-багатьох)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BookstoreDepartments' AND xtype='U')
BEGIN
    CREATE TABLE BookstoreDepartments (
        bookstore_id INT NOT NULL,
        department_id INT NOT NULL,
        PRIMARY KEY (bookstore_id, department_id),
        FOREIGN KEY (bookstore_id) REFERENCES Bookstores(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES Departments(id) ON DELETE CASCADE
    );
    
    PRINT 'Таблиця BookstoreDepartments створена';
END
GO

-- Вставка відділів
IF NOT EXISTS (SELECT * FROM Departments)
BEGIN
    INSERT INTO Departments (name) VALUES 
        (N'Художня література'),
        (N'Наукова література'),
        (N'Дитяча література'),
        (N'Бізнес'),
        (N'Поезія'),
        (N'Українська класика'),
        (N'Іноземні мови'),
        (N'Канцтовари'),
        (N'Подарункові видання');
    
    PRINT 'Відділи додані';
END
GO

-- Вставка тестових книгарень
IF NOT EXISTS (SELECT * FROM Bookstores)
BEGIN
    DECLARE @store1_id INT, @store2_id INT, @store3_id INT, @store4_id INT;
    
    -- Книгарня "Є"
    INSERT INTO Bookstores (name, address, hours, latitude, longitude)
    VALUES (N'Книгарня "Є"', N'вул. Лисенка, 3', N'10:00 - 21:00', 50.4501, 30.5234);
    SET @store1_id = SCOPE_IDENTITY();
    
    INSERT INTO BookstoreDepartments (bookstore_id, department_id)
    SELECT @store1_id, id FROM Departments WHERE name IN (
        N'Художня література', N'Наукова література', N'Дитяча література', N'Канцтовари'
    );
    
    -- Книгарня Yakaboo
    INSERT INTO Bookstores (name, address, hours, latitude, longitude)
    VALUES (N'Книгарня Yakaboo', N'вул. Велика Васильківська, 15', N'09:00 - 20:00', 50.4362, 30.5186);
    SET @store2_id = SCOPE_IDENTITY();
    
    INSERT INTO BookstoreDepartments (bookstore_id, department_id)
    SELECT @store2_id, id FROM Departments WHERE name IN (
        N'Художня література', N'Бізнес', N'Дитяча література', N'Іноземні мови'
    );
    
    -- Книгарня "Сяйво"
    INSERT INTO Bookstores (name, address, hours, latitude, longitude)
    VALUES (N'Книгарня "Сяйво"', N'Бульвар Тараса Шевченка, 36', N'10:00 - 19:00', 50.4447, 30.5038);
    SET @store3_id = SCOPE_IDENTITY();
    
    INSERT INTO BookstoreDepartments (bookstore_id, department_id)
    SELECT @store3_id, id FROM Departments WHERE name IN (
        N'Художня література', N'Поезія', N'Українська класика'
    );
    
    -- Book Ye
    INSERT INTO Bookstores (name, address, hours, latitude, longitude)
    VALUES (N'Book Ye', N'вул. Хрещатик, 44', N'10:00 - 21:00', 50.4477, 30.5236);
    SET @store4_id = SCOPE_IDENTITY();
    
    INSERT INTO BookstoreDepartments (bookstore_id, department_id)
    SELECT @store4_id, id FROM Departments WHERE name IN (
        N'Художня література', N'Наукова література', N'Подарункові видання', N'Канцтовари'
    );
    
    PRINT 'Тестові дані додані';
END
GO

-- Створення індексів для покращення продуктивності
CREATE NONCLUSTERED INDEX IX_Bookstores_Name ON Bookstores(name);
CREATE NONCLUSTERED INDEX IX_Bookstores_Address ON Bookstores(address);
CREATE NONCLUSTERED INDEX IX_BookstoreDepartments_BookstoreId ON BookstoreDepartments(bookstore_id);
CREATE NONCLUSTERED INDEX IX_BookstoreDepartments_DepartmentId ON BookstoreDepartments(department_id);
GO

PRINT 'База даних KyivBookstores успішно налаштована!';
GO

-- Перевірка результатів
SELECT 
    'Bookstores' AS TableName, 
    COUNT(*) AS RecordCount 
FROM Bookstores
UNION ALL
SELECT 
    'Departments' AS TableName, 
    COUNT(*) AS RecordCount 
FROM Departments
UNION ALL
SELECT 
    'BookstoreDepartments' AS TableName, 
    COUNT(*) AS RecordCount 
FROM BookstoreDepartments;
GO
