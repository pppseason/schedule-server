const axios = require('axios');

const start = Date.now();
axios.post(
  'https://api.moonshot.cn/v1/chat/completions',
  {
    model: 'doubao-seed-2.0-pro',
    messages: [{role:'system',content:'hi'},{role:'user',content:'hello'}],
    temperature: 1
  },
  {
    headers: { Authorization: 'Bearer sk-N6owPHE2HW7f1DXyjnoehZWdxy9aTGo7apXvlFbZupO97h5e', 'Content-Type': 'application/json' },
    timeout: 60000
  }
).then(res => {
  console.log('✅ 成功，耗时:', Date.now() - start, 'ms');
  console.log('内容:', res.data.choices[0].message.content.substring(0, 100));
}).catch(err => {
  console.log('❌ 失败，耗时:', Date.now() - start, 'ms');
  console.log('错误:', err.code, err.message);
});
