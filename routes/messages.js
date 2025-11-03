const express = require('express');
const router = express.Router();
const db = require('../db/init');

// 获取所有留言
router.get('/', async (req, res) => {
    try {
        const [messages] = await db.execute(
            `SELECT m.*, u.username 
             FROM messages m
             JOIN users u ON m.user_id = u.id
             ORDER BY m.created_at DESC`
        );
        res.json(messages);
    } catch (error) {
        console.error('获取留言失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 发表留言
router.post('/', async (req, res) => {
    try {
        // 检查用户是否登录
        if (!req.session.user) {
            return res.status(401).json({ error: '请先登录' });
        }

        const userId = req.session.user.id;
        const { content } = req.body;

        // 验证输入
        if (!content) {
            return res.status(400).json({ error: '留言内容不能为空' });
        }

        // 插入留言
        const [result] = await db.execute(
            'INSERT INTO messages (user_id, content, created_at) VALUES (?, ?, NOW())',
            [userId, content]
        );

        res.status(201).json({ 
            message: '发表留言成功', 
            messageId: result.insertId 
        });
    } catch (error) {
        console.error('发表留言失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除留言（仅管理员可用）
router.delete('/:id', async (req, res) => {
    try {
        // 检查是否为管理员
        if (!req.session.user || !req.session.user.isAdmin) {
            return res.status(403).json({ error: '权限不足' });
        }

        const messageId = req.params.id;

        // 检查留言是否存在
        const [messages] = await db.execute(
            'SELECT * FROM messages WHERE id = ?',
            [messageId]
        );

        if (messages.length === 0) {
            return res.status(404).json({ error: '留言不存在' });
        }

        // 删除留言
        await db.execute(
            'DELETE FROM messages WHERE id = ?',
            [messageId]
        );

        res.json({ message: '删除留言成功' });
    } catch (error) {
        console.error('删除留言失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;