const express = require('express');
const { get, run, all } = require('../db');
const { parseSchedule, parseScheduleFromImage } = require('../services/ai');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// AI 创建日程
router.post('/ai', authMiddleware, async (req, res) => {
  const { text } = req.body;
  const userId = req.userId;

  if (!text || !text.trim()) {
    return res.status(400).json({ code: 400, message: '缺少日程内容' });
  }

  try {
    const referenceTime = new Date().toISOString();
    const parsed = await parseSchedule(text.trim(), referenceTime);

    // 统一时间格式为 SQLite 可正确比较的 YYYY-MM-DD HH:mm:ss
    const fmt = (t) => t ? t.replace('T', ' ').replace(/\.\d{3}Z$/, '') : null;

    const result = await run(
      `INSERT INTO schedules (user_id, title, start_time, end_time, description, remind_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        parsed.title,
        fmt(parsed.start_time),
        fmt(parsed.end_time) || null,
        parsed.description || text,
        fmt(parsed.remind_at) || null
      ]
    );

    const schedule = await get('SELECT * FROM schedules WHERE id = ?', [result.lastID]);

    res.json({
      code: 0,
      message: '创建成功',
      data: schedule
    });
  } catch (err) {
    console.error('AI 解析失败:', err);
    res.status(500).json({ code: 500, message: 'AI 解析失败，请重试' });
  }
});

// AI 图片识别创建日程
router.post('/ai-image', authMiddleware, async (req, res) => {
  const { image } = req.body;
  const userId = req.userId;

  if (!image || !image.trim()) {
    return res.status(400).json({ code: 400, message: '缺少图片数据' });
  }

  // 限制图片大小：base64 长度超过 4,000,000 字符（约原图 2MB）拒绝
  const MAX_BASE64_LENGTH = 4000000;
  if (image.length > MAX_BASE64_LENGTH) {
    return res.status(400).json({
      code: 400,
      message: '图片过大，请压缩后重新上传（建议不超过 2MB）'
    });
  }

  try {
    const referenceTime = new Date().toISOString();
    const parsed = await parseScheduleFromImage(image.trim(), referenceTime);

    const fmt = (t) => t ? t.replace('T', ' ').replace(/\.\d{3}Z$/, '') : null;

    const result = await run(
      `INSERT INTO schedules (user_id, title, start_time, end_time, description, remind_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        parsed.title,
        fmt(parsed.start_time),
        fmt(parsed.end_time) || null,
        parsed.description || '',
        fmt(parsed.remind_at) || null
      ]
    );

    const schedule = await get('SELECT * FROM schedules WHERE id = ?', [result.lastID]);

    res.json({
      code: 0,
      message: '识别成功',
      data: schedule
    });
  } catch (err) {
    console.error('图片 AI 解析失败:', err);
    // 区分模型不支持图片的情况
    const msg = err.response && err.response.status === 400
      ? '当前 AI 模型不支持图片识别，请更换支持多模态的模型（如 doubao-seed-2.0-pro、GPT-4o）'
      : '图片识别失败，请重试或手动输入';
    res.status(500).json({ code: 500, message: msg });
  }
});

// 按日期查询日程列表
router.get('/list', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ code: 400, message: '缺少 date 参数' });
  }

  const start = `${date} 00:00:00`;
  const end = `${date} 23:59:59`;

  try {
    const schedules = await all(
      `SELECT * FROM schedules
       WHERE user_id = ?
         AND start_time >= ?
         AND start_time <= ?
       ORDER BY start_time ASC`,
      [userId, start, end]
    );

    res.json({ code: 0, data: schedules });
  } catch (err) {
    console.error('查询失败:', err);
    res.status(500).json({ code: 500, message: '查询失败' });
  }
});

// 按月查询（日历视图用）
router.get('/calendar', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ code: 400, message: '缺少 month 参数' });
  }

  const start = `${month}-01 00:00:00`;
  const endDay = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();
  const end = `${month}-${String(endDay).padStart(2, '0')} 23:59:59`;

  try {
    const rows = await all(
      `SELECT DISTINCT date(start_time) as day
       FROM schedules
       WHERE user_id = ?
         AND start_time >= ?
         AND start_time <= ?
       ORDER BY day ASC`,
      [userId, start, end]
    );

    res.json({ code: 0, data: rows.map(r => r.day) });
  } catch (err) {
    console.error('查询失败:', err);
    res.status(500).json({ code: 500, message: '查询失败' });
  }
});

// 删除日程
router.delete('/:id', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  try {
    const result = await run('DELETE FROM schedules WHERE id = ? AND user_id = ?', [id, userId]);
    if (result.changes === 0) {
      return res.status(404).json({ code: 404, message: '日程不存在或无权限' });
    }
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    console.error('删除失败:', err);
    res.status(500).json({ code: 500, message: '删除失败' });
  }
});

// 手动创建日程（备用）
router.post('/create', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const { title, start_time, end_time, description, remind_at } = req.body;

  if (!title || !start_time) {
    return res.status(400).json({ code: 400, message: '缺少标题或开始时间' });
  }

  try {
    const fmt = (t) => t ? t.replace('T', ' ').replace(/\.\d{3}Z$/, '') : null;
    const result = await run(
      `INSERT INTO schedules (user_id, title, start_time, end_time, description, remind_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, fmt(start_time), fmt(end_time) || null, description || '', fmt(remind_at) || null]
    );
    const schedule = await get('SELECT * FROM schedules WHERE id = ?', [result.lastID]);
    res.json({ code: 0, message: '创建成功', data: schedule });
  } catch (err) {
    console.error('创建失败:', err);
    res.status(500).json({ code: 500, message: '创建失败' });
  }
});

module.exports = router;
