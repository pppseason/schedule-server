const express = require('express');
const axios = require('axios');
const { get, run } = require('../db');
require('dotenv').config();

const router = express.Router();
const APPID = process.env.WECHAT_APPID;
const SECRET = process.env.WECHAT_SECRET;

// 微信登录，用code换openid
router.post('/login', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ code: 400, message: '缺少code参数' });
  }

  try {
    // 调用微信接口换openid
    const result = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: APPID,
        secret: SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const { openid, errcode, errmsg } = result.data;
    if (errcode) {
      console.error('微信登录失败:', errcode, errmsg);
      return res.status(500).json({ code: errcode, message: errmsg || '登录失败' });
    }

    // 自动创建用户
    const user = await get('SELECT * FROM users WHERE openid = ?', [openid]);
    if (!user) {
      await run('INSERT INTO users (openid) VALUES (?)', [openid]);
    }

    res.json({ code: 0, openid });
  } catch (err) {
    console.error('登录接口失败:', err);
    res.status(500).json({ code: 500, message: '登录失败' });
  }
});

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
