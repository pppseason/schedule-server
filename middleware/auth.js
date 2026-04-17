function authMiddleware(req, res, next) {
  // 不需要登录，默认用测试用户
  req.userId = 'test_user_001';
  next();
}

module.exports = authMiddleware;
