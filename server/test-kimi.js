const axios = require('axios');

const API_KEY = 'sk-N6owPHE2HW7f1DXyjnoehZWdxy9aTGo7apXvlFbZupO97h5e';
const BASE_URL = 'https://api.moonshot.cn/v1';
const MODEL = 'doubao-seed-2.0-pro';

async function testTextParse() {
  console.log('=== 测试 doubao-seed-2.0-pro 文字解析 ===');
  const start = Date.now();
  try {
    const res = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: '你是一个日程解析助手。' },
          { role: 'user', content: '当前时间是 2026-04-17T23:00:00Z。\n用户输入：明天下午3点健身' }
        ],
        temperature: 1
      },
      {
        headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );
    const elapsed = Date.now() - start;
    console.log(`✅ 成功，耗时: ${elapsed}ms`);
    console.log('回复内容:', res.data.choices[0].message.content.substring(0, 200));
    return elapsed;
  } catch (err) {
    const elapsed = Date.now() - start;
    console.log(`❌ 失败，耗时: ${elapsed}ms`);
    if (err.response) {
      console.log('状态码:', err.response.status);
      console.log('错误:', JSON.stringify(err.response.data, null, 2));
    } else if (err.code === 'ECONNABORTED') {
      console.log('错误: 请求超时');
    } else {
      console.log('错误:', err.message);
    }
    return null;
  }
}

async function testHealthCheck() {
  console.log('\n=== 测试后端健康检查 ===');
  const start = Date.now();
  try {
    const res = await axios.get('http://127.0.0.1:3456/', { timeout: 5000 });
    const elapsed = Date.now() - start;
    console.log(`✅ 成功，耗时: ${elapsed}ms`);
    console.log('响应:', res.data);
    return elapsed;
  } catch (err) {
    const elapsed = Date.now() - start;
    console.log(`❌ 失败，耗时: ${elapsed}ms`);
    console.log('错误:', err.message);
    return null;
  }
}

(async () => {
  await testTextParse();
  await testHealthCheck();
})();
