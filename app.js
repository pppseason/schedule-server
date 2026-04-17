const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const { get, run } = require('./db');
const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedule');
const { checkAndSendReminders } = require('./services/reminder');

const app = express();
const PORT = 80;

// 每 5 分钟检查一次待提醒日程
cron.schedule('*/5 * * * *', () => {
  console.log('[' + new Date().toISOString() + '] 检查待提醒日程...');
  checkAndSendReminders();
});

app.use(cors());
app.use(express.json());

// 健康检查
app.get('/', (req, res) => {
  res.json({ message: '日程管理小程序后端服务运行中', time: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/schedule', scheduleRoutes);

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
