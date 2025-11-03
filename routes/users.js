const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db/init');

// 获取所有用户（仅管理员可用）
router.get('/', async (req, res) => {
    try {
        // 检查是否为管理员
        if (!req.session.user || !req.session.user.isAdmin) {
            return res.status(403).json({ error: '权限不足' });
        }

        const [users] = await db.execute(
            'SELECT id, username, email, created_at, is_admin FROM users'
        );

        res.json(users);
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 验证输入
        if (!username || !email || !password) {
            return res.status(400).json({ error: '所有字段都是必填的' });
        }

        // 检查用户名是否已存在
        const [existingUsers] = await db.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: '用户名已存在' });
        }

        // 检查邮箱是否已存在
        const [existingEmails] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingEmails.length > 0) {
            return res.status(400).json({ error: '邮箱已被注册' });
        }

        // 密码加密
        const hashedPassword = await bcrypt.hash(password, 10);

        // 插入新用户
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(201).json({ message: '注册成功', userId: result.insertId });
    } catch (error) {
        console.error('用户注册失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 验证输入
        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码都是必填的' });
        }

        // 查找用户
        const [users] = await db.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const user = users[0];

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 创建会话
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            isAdmin: user.is_admin === 1
        };

        res.json({
            message: '登录成功',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.is_admin === 1
            }
        });
    } catch (error) {
        console.error('用户登录失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 用户退出登录
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('退出登录失败:', err);
            return res.status(500).json({ error: '服务器错误' });
        }
        res.json({ message: '退出登录成功' });
    });
});

module.exports = router;