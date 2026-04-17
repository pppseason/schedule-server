# AI 日程助手（微信小程序）

一个基于自然语言的智能日程管理小程序。用户只需用日常口语描述日程，AI 自动解析时间、地点、内容并生成结构化日程，通过微信订阅消息准时提醒。

---

## 产品功能

- **自然语言创建日程**：输入"明天下午3点和老板开会，大概1小时"即可自动识别
- **日历视图**：按月查看哪些日期有日程安排
- **每日列表**：左右切换日期，查看当日所有日程
- **微信订阅提醒**：日程开始前自动推送微信通知
- **账号隔离**：基于微信 openid，每个用户数据完全独立

---

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端 | 微信小程序原生开发 |
| 后端 | Node.js + Express |
| 数据库 | SQLite (better-sqlite3) |
| AI 解析 | 火山引擎方舟 (doubao-seed-2.0-pro) API |
| 消息推送 | 微信小程序订阅消息 |

---

## 项目结构

```
├── miniapp/              # 微信小程序前端
│   ├── pages/
│   │   ├── index/        # 首页：输入日程 + 每日列表
│   │   └── calendar/     # 日历页：按月查看日程分布
│   ├── utils/request.js  # 网络请求封装
│   └── app.js / app.json
│
└── server/               # 后端服务
    ├── app.js            # Express 入口
    ├── db.js             # SQLite 数据库初始化
    ├── routes/
    │   ├── auth.js       # 微信登录接口
    │   └── schedule.js   # 日程 CRUD + AI 解析
    ├── services/
    │   ├── ai.js         # doubao-seed-2.0-pro AI 调用
    │   ├── wechat.js     # 微信 API 封装
    │   └── reminder.js   # 定时提醒任务
    └── middleware/
        └── auth.js       # JWT 鉴权中间件
```

---

## 快速开始

### 1. 配置后端

进入 `server/` 目录，编辑 `.env` 文件：

```env
PORT=3000

# 微信小程序 AppID 和 Secret（从微信公众平台获取）
WECHAT_APPID=wx_xxxxxxxxxxxxxxxx
WECHAT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# doubao-seed-2.0-pro (火山引擎方舟) API Key（从 https://www.volcengine.com/product/ark 获取）
AI_API_KEY=32ca7530-fa27-46a0-b1d0-943b6695720b

# 随便填一个随机字符串
JWT_SECRET=your_random_secret_key
```

安装依赖并启动：

```bash
cd server
npm install
npm start
```

后端默认运行在 `http://localhost:3000`。

### 2. 配置小程序前端

用微信开发者工具打开 `miniapp/` 目录。

在 `miniapp/app.js` 中确认后端地址：

```javascript
globalData: {
  apiBase: 'http://localhost:3000',  // 开发时填本机 IP + 端口，真机调试需改为局域网 IP
  token: null
}
```

在微信开发者工具中，将该小程序的 AppID 设置为你自己的 AppID（与后端 .env 中的保持一致）。

### 3. 开启订阅消息（可选，用于提醒推送）

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入「功能」→「订阅消息」
3. 选用一个合适的公共模板（例如：日程提醒）
4. 复制模板 ID，填入后端 `.env` 中的 `WECHAT_TEMPLATE_ID` 变量
5. 在 `miniapp/pages/index/index.js` 中，将 `requestSubscribeMessage` 的 `tmplIds` 替换为你的模板 ID

> 个人主体小程序也支持订阅消息，每次推送前需用户授权。

---

## 核心接口说明

| 接口 | 方法 | 说明 |
|---|---|---|
| `/auth/login` | POST | 微信登录，返回 JWT token |
| `/schedule/ai` | POST | AI 解析自然语言并创建日程 |
| `/schedule/list?date=YYYY-MM-DD` | GET | 按日查询日程 |
| `/schedule/calendar?month=YYYY-MM` | GET | 按月查询有日程的日期 |
| `/schedule/:id` | DELETE | 删除指定日程 |
| `/schedule/create` | POST | 手动创建日程（备用） |

---

## 数据库模型

### users（用户表）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER | 自增主键 |
| openid | TEXT | 微信用户唯一标识 |
| created_at | DATETIME | 注册时间 |

### schedules（日程表）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER | 自增主键 |
| user_id | TEXT | 所属用户（openid） |
| title | TEXT | 日程标题 |
| start_time | DATETIME | 开始时间 |
| end_time | DATETIME | 结束时间 |
| description | TEXT | 原始指令/描述 |
| remind_at | DATETIME | 提醒时间 |
| remind_sent | INTEGER | 是否已发送提醒（0=否，1=是） |
| created_at | DATETIME | 创建时间 |

---

## 后续可拓展方向

1. **重复日程**：支持"每周一晨会"等周期性日程
2. **语音输入**：小程序直接录音，语音转文字后调用 AI 解析
3. **共享日程**：邀请好友查看/共同编辑某个日程
4. **智能建议**：AI 根据日程密度给出时间安排建议
5. **多端同步**：开发 Web 版或 App，同一账号数据互通

---

## 注意事项

- 开发阶段小程序请求后端需关闭「不校验合法域名」选项，或在开发者工具中开启
- 真机预览时，`apiBase` 不能填 `localhost`，需改为电脑局域网 IP（如 `http://192.168.1.x:3000`）
- 订阅消息模板需与后端 `reminder.js` 中构造的 `data` 字段匹配，否则推送会失败
