const mysql = require('mysql2');

// 创建数据库连接池
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '224946',
    database: 'sportproject01',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 导出promise版本的连接池
const promisePool = pool.promise();

// 初始化数据库表
async function initDatabase() {
    try {
        // 创建用户表
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 创建场馆表
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS venues (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                location VARCHAR(255) NOT NULL,
                vip_seats INT NOT NULL,
                standard_seats INT NOT NULL,
                economy_seats INT NOT NULL
            )
        `);

        // 创建赛事表
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type ENUM('羽毛球', '足球', '射击', '乒乓球', '篮球') NOT NULL,
                organizer VARCHAR(100) NOT NULL,
                organizer_info TEXT,
                participants TEXT NOT NULL,
                description TEXT,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                venue_id INT NOT NULL,
                vip_price DECIMAL(10, 2) NOT NULL,
                standard_price DECIMAL(10, 2) NOT NULL,
                economy_price DECIMAL(10, 2) NOT NULL,
                ticket_sale_start DATETIME NOT NULL,
                ticket_sale_end DATETIME NOT NULL,
                FOREIGN KEY (venue_id) REFERENCES venues(id)
            )
        `);

        // 创建票务表
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                event_id INT NOT NULL,
                seat_type ENUM('vip', 'standard', 'economy') NOT NULL,
                quantity INT NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                status ENUM('active', 'cancelled') NOT NULL DEFAULT 'active',
                purchase_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (event_id) REFERENCES events(id)
            )
        `);

        // 创建留言板表
        await promisePool.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // 检查是否已有管理员账户
        const [adminCheck] = await promisePool.execute(
            'SELECT * FROM users WHERE is_admin = TRUE'
        );

        // 如果没有管理员账户，创建默认管理员
        if (adminCheck.length === 0) {
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await promisePool.execute(
                'INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)',
                ['admin', 'admin@example.com', hashedPassword, true]
            );
            
            console.log('默认管理员账户已创建');
        }

        console.log('数据库初始化完成');
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    }
}

// 执行初始化
initDatabase().catch(console.error);

module.exports = pool.promise();