const axios = require('axios');
require('dotenv').config();

// 优先使用.env配置，没有则用默认参数
const API_KEY = process.env.AI_API_KEY || '32ca7530-fa27-46a0-b1d0-943b6695720b';
const BASE_URL = process.env.AI_BASE_URL || 'https://ark.cn-beijing.volces.com/api/coding/v3';
const MODEL = process.env.AI_MODEL || 'doubao-seed-2.0-pro';

async function testDoubao() {
  console.log('🚀 开始测试豆包AI（纯对话模式，不使用任何工具）...');
  console.log('🔧 配置信息：');
  console.log(`   - API地址：${BASE_URL}`);
  console.log(`   - 模型：${MODEL}`);
  console.log(`   - 密钥已配置：${!!API_KEY}`);

  try {
    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: '你是一个日程解析助手，直接返回结果，不要调用任何工具，不要使用任何插件，不需要额外解释。'
          },
          {
            role: 'user',
            content: '当前时间是2026-04-18 02:00，请把"明天下午3点和产品开需求评审会，预计1.5小时"解析为日程JSON，包含title、start_time、end_time、remind_at四个字段，只返回JSON，不要其他内容。'
          }
        ],
        temperature: 0.1,
        // 明确禁用所有工具调用
        tool_choice: 'none',
        tools: []
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('\n✅ 调用成功！返回结果：');
    console.log('--------------------------------------------------');
    const result = response.data.choices[0].message.content.trim();
    console.log(result);
    console.log('--------------------------------------------------');
    
    // 尝试解析JSON验证格式
    try {
      const schedule = JSON.parse(result);
      console.log('\n🎉 格式验证通过：');
      console.log(`   - 标题：${schedule.title}`);
      console.log(`   - 开始时间：${schedule.start_time}`);
      console.log(`   - 结束时间：${schedule.end_time}`);
      console.log(`   - 提醒时间：${schedule.remind_at}`);
      console.log('\n✅ 测试通过：豆包AI可以正常脱离工具使用，返回结果符合预期！');
    } catch (e) {
      console.log('\n⚠️  返回内容不是标准JSON格式，原始内容如上');
    }

  } catch (err) {
    console.error('\n❌ 调用失败：');
    if (err.response) {
      console.error(`   状态码：${err.response.status}`);
      console.error(`   错误信息：${JSON.stringify(err.response.data, null, 2)}`);
    } else if (err.code) {
      console.error(`   错误码：${err.code}`);
      console.error(`   错误信息：${err.message}`);
    } else {
      console.error(`   错误信息：${err.message}`);
    }
  }
}

testDoubao();
