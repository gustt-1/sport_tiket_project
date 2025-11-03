const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// 初始化数据库
require('./db/init');

// 导入路由
const usersRouter = require('./routes/users');
const venuesRouter = require('./routes/venues');
const eventsRouter = require('./routes/events');
const ticketsRouter = require('./routes/tickets');
const messagesRouter = require('./routes/messages');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 配置会话
app.use(session({
    secret: 'sports_venue_ticketing_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24小时
}));

// API路由
app.use('/api/users', usersRouter);
app.use('/api/venues', venuesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/messages', messagesRouter);

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});