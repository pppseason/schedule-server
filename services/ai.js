const axios = require('axios');
const https = require('https');
require('dotenv').config();

const API_KEY = process.env.AI_API_KEY || '32ca7530-fa27-46a0-b1d0-943b6695720b';
const BASE_URL = process.env.AI_BASE_URL || 'https://ark.cn-beijing.volces.com/api/coding/v3';
const MODEL = process.env.AI_MODEL || 'doubao-seed-2.0-mini';

console.log('AI 配置:', { baseUrl: BASE_URL, model: MODEL, hasKey: !!API_KEY, nodeVersion: process.version });

const TEXT_PARSE_PROMPT = (referenceTime) => `当前时间是 ${referenceTime}（中国北京时间，UTC+8）。
用户用自然语言输入了一个日程指令，请解析并提取以下信息，以 JSON 格式返回：
{
  "title": "日程标题",
  "start_time": "ISO 8601 格式的开始时间（必须返回有效值，不能为null）",
  "end_time": "ISO 8601 格式的结束时间（可选，若用户没提则 null）",
  "description": "用户的原始输入",
  "remind_at": "ISO 8601 格式的提醒时间（可选，若用户没提则默认为开始时间前15分钟）"
}

注意事项：
1. 所有时间都按照北京时间计算，不要转换为UTC时间。
2. 如果用户说"明天下午三点开会"，start_time 应该是当前日期往后推1天的下午三点；如果当前时间在0点到6点之间，"明天"是指当前日期往后推2天。
3. 如果用户说"大概1小时"，end_time 应该是 start_time + 1小时。
4. 如果用户没提提醒时间，remind_at 设为 start_time 前15分钟。
5. 【模糊时间处理】如果用户输入的时间比较模糊（比如"有空的时候""过两天""下周""最近""晚点""有空再说"等），无法确定具体时间的话：
   - 默认设置 start_time 为当前日期往后推1天的晚上20:00
   - 如果用户只说了"上午/下午/晚上"没说具体时间，默认上午为9:00，下午为15:00，晚上为20:00
   - 无论如何都必须返回有效的start_time，绝对不能返回null或空值
6. 如果日期已经过了，自动调整到明年的相同日期。
7. 只返回 JSON，不要有任何其他文字或 markdown 代码块。`;

const IMAGE_PARSE_PROMPT = (referenceTime) => `当前时间是 ${referenceTime}（中国北京时间，UTC+8）。
用户上传了一张图片（可能是机票、演唱会门票、活动海报等），请识别图片中的关键信息，并提取为日程数据，以 JSON 格式返回：
{
  "title": "日程标题（如：航班/演唱会/会议名称）",
  "start_time": "ISO 8601 格式的开始时间（必须返回有效值，不能为null）",
  "end_time": "ISO 8601 格式的结束时间（可选，若图片中没提则 null）",
  "description": "详细描述（如地点、航班号、座位号等图片中的关键信息）",
  "remind_at": "ISO 8601 格式的提醒时间（可选，若图片中没提则默认为开始时间前2小时）"
}

注意事项：
1. 所有时间都按照北京时间计算，不要转换为UTC时间。
2. 仔细识别图片中的日期和时间，转换为 ISO 8601 格式。
3. 如果图片只有日期没有具体时间，start_time 设为该日期的上午9点。
4. 如果是航班，start_time 为起飞时间，end_time 为降落时间（若有）。
5. 如果是演唱会/活动，start_time 为开场时间。
6. 如果图片中没有明确年份，假设为今年；如果日期已过，假设为明年。
7. 【模糊时间处理】如果图片中的时间比较模糊无法识别，默认设置 start_time 为当前日期往后推1天的晚上20:00，remind_at为开始前2小时。
8. remind_at 没提则默认为 start_time 前2小时，无论如何都必须返回有效的start_time，不能为null。
9. 只返回 JSON，不要有任何其他文字或 markdown 代码块。`;

function getAIHeaders() {
  return {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };
}

async function callAI(messages) {
  const start = Date.now();
  try {
    console.log(`[${Date.now()}] 开始调用 doubao-seed-2.0-pro API...`);
    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages,
        temperature: 1
      },
      {
        headers: getAIHeaders(),
        timeout: 30000, // 30 秒超时
        httpsAgent: new https.Agent({ keepAlive: false }), // 禁用 keep-alive 避免连接复用问题
        family: 4 // 强制 IPv4
      }
    );
    console.log(`[${Date.now()}] doubao-seed-2.0-pro API 响应成功，耗时: ${Date.now() - start}ms`);

    const content = response.data.choices[0].message.content.trim();
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error(`[${Date.now()}] doubao-seed-2.0-pro API 失败，耗时: ${Date.now() - start}ms`);
    if (err.response) {
      console.error('AI API 错误:', err.response.status, JSON.stringify(err.response.data, null, 2));
    } else if (err.code) {
      console.error('AI 请求错误码:', err.code, err.message);
    } else {
      console.error('AI 请求失败:', err.message);
    }
    throw err;
  }
}

async function parseSchedule(input, referenceTime) {
  const messages = [
    { role: 'system', content: '你是一个日程解析助手，专门把用户的自然语言指令转换成结构化的日程数据。' },
    { role: 'user', content: `${TEXT_PARSE_PROMPT(referenceTime)}\n\n用户输入：${input}` }
  ];
  return callAI(messages);
}

async function parseScheduleFromImage(base64Image, referenceTime) {
  // 确保 base64 包含 data URI 前缀
  const imageUrl = base64Image.startsWith('data:')
    ? base64Image
    : `data:image/jpeg;base64,${base64Image}`;

  const messages = [
    { role: 'system', content: '你是一个日程识别助手，专门从图片（机票、门票、海报等）中提取日程信息。' },
    {
      role: 'user',
      content: [
        { type: 'text', text: IMAGE_PARSE_PROMPT(referenceTime) },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    }
  ];
  return callAI(messages);
}

module.exports = {
  parseSchedule,
  parseScheduleFromImage
};
