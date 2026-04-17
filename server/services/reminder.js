const { all, run } = require('../db');
const { sendSubscribeMessage } = require('./wechat');

const TEMPLATE_ID = process.env.WECHAT_TEMPLATE_ID || 'your_template_id_here';

async function checkAndSendReminders() {
  const now = new Date().toISOString();

  try {
    const rows = await all(
      `SELECT * FROM schedules
       WHERE remind_at IS NOT NULL
         AND remind_at <= ?
         AND remind_sent = 0`,
      [now]
    );

    for (const schedule of rows) {
      try {
        await sendSubscribeMessage(
          schedule.user_id,
          TEMPLATE_ID,
          'pages/index/index',
          {
            thing1: { value: schedule.title },
            time2: { value: schedule.start_time.substring(0, 16).replace('T', ' ') }
          }
        );
        // 标记已发送
        await run('UPDATE schedules SET remind_sent = 1 WHERE id = ?', [schedule.id]);
        console.log(`已发送提醒: ${schedule.title} 给用户 ${schedule.user_id}`);
      } catch (err) {
        console.error(`发送提醒失败: ${schedule.id}`, err.message);
      }
    }
  } catch (err) {
    console.error('检查提醒任务失败:', err.message);
  }
}

module.exports = { checkAndSendReminders };
