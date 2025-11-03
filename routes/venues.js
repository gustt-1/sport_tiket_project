const express = require('express');
const router = express.Router();
const db = require('../db/init');

// 获取所有场馆
router.get('/', async (req, res) => {
    try {
        const [venues] = await db.execute(
            'SELECT * FROM venues'
        );
        res.json(venues);
    } catch (error) {
        console.error('获取场馆列表失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 添加新场馆（仅管理员可用）
router.post('/', async (req, res) => {
    try {
        // 检查是否为管理员
        if (!req.session.user || !req.session.user.isAdmin) {
            return res.status(403).json({ error: '权限不足' });
        }

        const { name, location, vip_seats, standard_seats, economy_seats } = req.body;

        // 验证输入
        if (!name || !location || !vip_seats || !standard_seats || !economy_seats) {
            return res.status(400).json({ error: '所有字段都是必填的' });
        }

        // 插入新场馆
        const [result] = await db.execute(
            'INSERT INTO venues (name, location, vip_seats, standard_seats, economy_seats) VALUES (?, ?, ?, ?, ?)',
            [name, location, vip_seats, standard_seats, economy_seats]
        );

        res.status(201).json({ 
            message: '添加场馆成功', 
            venueId: result.insertId 
        });
    } catch (error) {
        console.error('添加场馆失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;