const express = require('express');
const router = express.Router();
const db = require('../db/init');

// 获取所有赛事或特定赛事
router.get('/', async (req, res) => {
    try {
        const { id, type } = req.query;
        
        let query = `
            SELECT e.*, v.name as venue_name, v.location as venue_location 
            FROM events e
            JOIN venues v ON e.venue_id = v.id
        `;
        
        const params = [];
        
        if (id) {
            query += ' WHERE e.id = ?';
            params.push(id);
        } else if (type) {
            query += ' WHERE e.type = ?';
            params.push(type);
        }
        
        const [events] = await db.execute(query, params);
        res.json(events);
    } catch (error) {
        console.error('获取赛事列表失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 添加新赛事（仅管理员可用）
router.post('/', async (req, res) => {
    try {
        // 检查是否为管理员
        if (!req.session.user || !req.session.user.isAdmin) {
            return res.status(403).json({ error: '权限不足' });
        }

        const { 
            name, type, organizer, organizer_info, participants, description,
            start_time, end_time, venue_id, vip_price, standard_price, economy_price,
            ticket_sale_start, ticket_sale_end
        } = req.body;

        // 验证输入
        if (!name || !type || !organizer || !participants || !start_time || 
            !end_time || !venue_id || !vip_price || !standard_price || 
            !economy_price || !ticket_sale_start || !ticket_sale_end) {
            return res.status(400).json({ error: '必填字段不能为空' });
        }

        // 检查场馆是否存在
        const [venues] = await db.execute(
            'SELECT * FROM venues WHERE id = ?',
            [venue_id]
        );

        if (venues.length === 0) {
            return res.status(400).json({ error: '场馆不存在' });
        }

        // 插入新赛事
        const [result] = await db.execute(
            `INSERT INTO events (
                name, type, organizer, organizer_info, participants, description,
                start_time, end_time, venue_id, vip_price, standard_price, economy_price,
                ticket_sale_start, ticket_sale_end
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, type, organizer, organizer_info, participants, description,
                start_time, end_time, venue_id, vip_price, standard_price, economy_price,
                ticket_sale_start, ticket_sale_end
            ]
        );

        res.status(201).json({ 
            message: '添加赛事成功', 
            eventId: result.insertId 
        });
    } catch (error) {
        console.error('添加赛事失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;