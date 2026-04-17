# 项目长期记忆
---
## 📋 项目完整开发历史（2026-04-17）
### 1. MVP开发完成
- 开发了完整的「AI 日程助手」微信小程序 MVP
- 核心功能：自然语言创建日程、日历视图、每日列表、微信登录隔离、定时提醒推送
- 已验证：后端服务正常启动运行，所有联调bug已修复
  - 修复了401（Bearer前缀）、403（Kimi Coding不可用）、日程时间格式（SQLite字符串比较）、日历跳转（switchTab不触发onLoad）等问题

### 2. 部署历程
- 第一方案：阿里云ECS（IP: 114.55.40.135）+ 域名longxiac.pppgod.com，已配置SSL证书和PM2守护，后因ICP备案拦截443端口放弃
- 最终方案：微信云托管
  - GitHub仓库：pppseason/schedule-server
  - 云托管环境ID：prod-d7gzti9wmaf3faa49
  - 服务域名：https://schedule-server-247739-4-1423159736.sh.run.tcloudbase.com
  - 版本schedule-server-001运行正常，API验证通过

### 3. 技术栈演进
- 后端：Node.js + Express + SQLite，通过`x-wx-openid` header获取用户身份，无需JWT/token
- 前端：使用`wx.cloud.callContainer`内网调用云托管服务，无需配置服务器域名
- AI模型历史：
  1. 最早：Moonshot Kimi API → 切换为Kimi Coding（仅限Coding Agent访问，不可用）
  2. 切换到DeepSeek → 曾出现402余额不足，后充值恢复
  3. 后续：切换到腾讯TokenHub（tokenhub.tencentmaas.com）
  4. 当前：火山引擎方舟 doubao-seed-2.0-pro

### 4. 云托管踩坑经验（重要）
- `container.config.json`中不要配置`dataBaseName`和`executeSQLs`，否则会尝试连接不存在的云数据库导致容器崩溃
- Node.js服务必须监听`0.0.0.0`，不能默认绑定IPv6（::），否则云托管健康检查失败，实例数始终为0
- Alpine镜像下sqlite3原生模块编译失败，需使用`node:20`完整镜像 + 安装`python3 make g++`
- Kimi API的`temperature`参数只能传1，其他值返回400
- 云托管容器内存至少1C2G，0.5GB会在图片识别时OOM崩溃
- 腾讯云内网调用TokenHub响应约20-30秒

### 5. 已配置的固定信息
- 微信小程序AppID：wxbba514c6a919d753
- 微信AppSecret：fe5fc1e360863f21df50899990cdf1ea
- 微信订阅消息模板ID：ib2N8c_bfewQB-zGs7a5bTLGQm_9CGwncb08h2h8hm8
- JWT密钥：your_random_jwt_secret_here_change_this

---
## 📋 近期操作历史（2026-04-18）
### 1. 第一次模型替换：Kimi → K2.6-code-preview
- 操作：将项目内所有出现的`kimi`/`kimi-k2.5`全部替换为`K2.6-code-preview`
- 涉及文件：ai.js、schedule.js、测试脚本、container.config.json、README.md、.env
- 结果：全量替换完成，无遗漏

### 2. 第二次模型替换：K2.6-code-preview → 火山引擎豆包
- 新配置：
  - API地址：https://ark.cn-beijing.volces.com/api/coding/v3
  - API密钥：32ca7530-fa27-46a0-b1d0-943b6695720b
  - 模型名：doubao-seed-2.0-pro
- 操作：全量替换所有相关配置，包括日志文本、文档说明、测试脚本等
- 结果：验证通过，无遗漏的旧模型名称

### 3. GitHub上传准备
- 已完成：Git仓库初始化，默认分支改为main，创建.gitignore配置文件（忽略敏感配置、依赖、日志、数据库文件等）
- 问题：发现server目录下存在内嵌Git仓库，已告知用户两种处理方案
- 当前状态：等待用户提供GitHub仓库地址，即可完成提交推送

---
## 📋 项目核心信息
- 项目名称：AI日程助手微信小程序
- 功能：自然语言/图片识别自动创建日程，微信订阅消息提醒，日历视图管理
- 技术栈：
  - 前端：微信小程序原生开发（miniapp/目录）
  - 后端：Node.js + Express + SQLite（server/目录）
  - AI能力：火山引擎方舟 doubao-seed-2.0-pro 模型

## 🤖 AI模型配置变更完整历史
1. 版本1：Moonshot Kimi / kimi-k2.5 / DeepSeek / 腾讯TokenHub
2. 版本2：K2.6-code-preview
3. 最终当前版本：火山引擎方舟 doubao-seed-2.0-pro
   - API地址：`https://ark.cn-beijing.volces.com/api/coding/v3`
   - API密钥：`32ca7530-fa27-46a0-b1d0-943b6695720b`

## 👤 用户偏好记录
- 交互风格：简洁直接，拒绝不必要的格式辅助，优先直接操作文件
- 习惯：倾向提供文件而非粘贴内容
