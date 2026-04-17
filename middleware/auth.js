const { get, run } = require('../db');

function authMiddleware(req, res, next) {
  const openid = req.headers['x-wx-openid'];

  if (!openid) {
    return res.status(401).json({ code: 401, message: '未获取到用户身份' });
  }

  req.userId = openid;

  // 自动创建用户（如果不存在）
  get('SELECT * FROM users WHERE openid = ?', [openid])
    .then(user => {
      if (!user) {
        return run('INSERT INTO users (openid) VALUES (?)', [openid]);
      }
    })
    .then(() => next())
    .catch(err => {
      console.error('自动创建用户失败:', err);
      next();
    });
}

module.exports = authMiddleware;
