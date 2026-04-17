const express = require('express');
const { get } = require('../db');

const router = express.Router();

// 获取当前用户信息（云托管自动附带 x-wx-openid）
router.get('/me', async (req, res) => {
  const openid = req.headers['x-wx-openid'];
  if (!openid) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }

  try {
    const user = await get('SELECT * FROM users WHERE openid = ?', [openid]);
    res.json({
      code: 0,
      data: {
        openid,
        exists: !!user
      }
    });
  } catch (err) {
    console.error('获取用户信息失败:', err);
    res.status(500).json({ code: 500, message: '获取用户信息失败' });
  }
});

module.exports = router;
