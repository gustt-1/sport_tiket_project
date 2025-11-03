const express = require('express');
const router = express.Router();
const db = require('../db/init');

// 获取用户的票务信息
router.get('/user', async (req, res) => {
    try {
        // 检查用户是否登录
        if (!req.session.user) {
            return res.status(401).json({ error: '请先登录' });
        }

        const userId = req.session.user.id;

        const [tickets] = await db.execute(
            `SELECT t.*, e.name as event_name, e.type as event_type, e.start_time, 
                    v.name as venue_name, v.location as venue_location
             FROM tickets t
             JOIN events e ON t.event_id = e.id
             JOIN venues v ON e.venue_id = v.id
             WHERE t.user_id = ?
             ORDER BY t.purchase_time DESC`,
            [userId]
        );

        res.json(tickets);
    } catch (error) {
        console.error('获取用户票务失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 购买票务
router.post('/', async (req, res) => {
    try {
        // 检查用户是否登录
        if (!req.session.user) {
            return res.status(401).json({ error: '请先登录' });
        }

        const userId = req.session.user.id;
        const { event_id, seat_type, quantity } = req.body;

        // 验证输入
        if (!event_id || !seat_type || !quantity) {
            return res.status(400).json({ error: '所有字段都是必填的' });
        }

        // 检查赛事是否存在
        const [events] = await db.execute(
            'SELECT * FROM events WHERE id = ?',
            [event_id]
        );

        if (events.length === 0) {
            return res.status(400).json({ error: '赛事不存在' });
        }

        const event = events[0];

        // 检查是否在售票时间内
        const now = new Date();
        const saleStart = new Date(event.ticket_sale_start);
        const saleEnd = new Date(event.ticket_sale_end);

        if (now < saleStart || now > saleEnd) {
            return res.status(400).json({ error: '不在售票时间内' });
        }

        // 获取票价
        let price = 0;
        if (seat_type === 'vip') {
            price = event.vip_price;
        } else if (seat_type === 'standard') {
            price = event.standard_price;
        } else if (seat_type === 'economy') {
            price = event.economy_price;
        } else {
            return res.status(400).json({ error: '座位类型无效' });
        }

        // 检查座位是否足够
        const [venues] = await db.execute(
            'SELECT * FROM venues WHERE id = ?',
            [event.venue_id]
        );

        if (venues.length === 0) {
            return res.status(400).json({ error: '场馆不存在' });
        }

        const venue = venues[0];

        // 计算已售出的票数
        const [soldTickets] = await db.execute(
            'SELECT SUM(quantity) as sold FROM tickets WHERE event_id = ? AND seat_type = ? AND status = "active"',
            [event_id, seat_type]
        );

        const soldCount = soldTickets[0].sold || 0;
        let availableSeats = 0;

        if (seat_type === 'vip') {
            availableSeats = venue.vip_seats;
        } else if (seat_type === 'standard') {
            availableSeats = venue.standard_seats;
        } else if (seat_type === 'economy') {
            availableSeats = venue.economy_seats;
        }

        if (soldCount + parseInt(quantity) > availableSeats) {
            return res.status(400).json({ error: '座位不足' });
        }

        // 计算总价
        const totalPrice = price * quantity;

        // 创建票务记录
        const [result] = await db.execute(
            `INSERT INTO tickets (user_id, event_id, seat_type, quantity, price, total_price, status, purchase_time)
             VALUES (?, ?, ?, ?, ?, ?, "active", NOW())`,
            [userId, event_id, seat_type, quantity, price, totalPrice]
        );

        res.status(201).json({
            message: '购票成功',
            ticketId: result.insertId,
            totalPrice
        });
    } catch (error) {
        console.error('购票失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 取消票务
router.put('/:id/cancel', async (req, res) => {
    try {
        // 检查用户是否登录
        if (!req.session.user) {
            return res.status(401).json({ error: '请先登录' });
        }

        const userId = req.session.user.id;
        const ticketId = req.params.id;

        // 检查票务是否存在且属于当前用户
        const [tickets] = await db.execute(
            'SELECT * FROM tickets WHERE id = ? AND user_id = ?',
            [ticketId, userId]
        );

        if (tickets.length === 0) {
            return res.status(404).json({ error: '票务不存在或不属于当前用户' });
        }

        const ticket = tickets[0];

        // 检查票务是否已经取消
        if (ticket.status !== 'active') {
            return res.status(400).json({ error: '票务已经取消' });
        }

        // 获取赛事信息
        const [events] = await db.execute(
            'SELECT * FROM events WHERE id = ?',
            [ticket.event_id]
        );

        if (events.length === 0) {
            return res.status(400).json({ error: '赛事不存在' });
        }

        const event = events[0];

        // 检查是否可以取消（赛事开始前24小时）
        const now = new Date();
        const eventStart = new Date(event.start_time);
        const cancelDeadline = new Date(eventStart.getTime() - 24 * 60 * 60 * 1000);

        if (now > cancelDeadline) {
            return res.status(400).json({ error: '赛事即将开始，无法取消票务' });
        }

        // 更新票务状态
        await db.execute(
            'UPDATE tickets SET status = "cancelled" WHERE id = ?',
            [ticketId]
        );

        res.json({ message: '取消票务成功' });
    } catch (error) {
        console.error('取消票务失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;