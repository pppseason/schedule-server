# 微信云托管部署指南

将你的「AI 日程助手」后端部署到微信云托管，实现免运维、自动 HTTPS、和小程序无缝集成。

---

## 一、前置准备

1. **已注册微信小程序**（已有 AppID: `wxbba514c6a919d753`）
2. **已开通微信云托管服务**
3. **本机已安装 Docker**（用于本地构建镜像，可选）

---

## 二、开通微信云托管

1. 登录 [微信云托管控制台](https://cloud.weixin.qq.com/cloudrun)
2. 使用你的小程序账号扫码登录
3. 选择对应小程序 → 点击「去开通」
4. 按提示完成开通（个人主体也可以开，有免费额度）

---

## 三、创建服务并部署

### 方式 A：通过 CLI 命令行部署（推荐）

#### 1. 安装微信云托管 CLI
```bash
npm install -g @wxcloud/cli
```

#### 2. 登录 CLI
```bash
wxcloud login
```
会弹出二维码，用微信扫码登录。

#### 3. 进入后端目录
```bash
cd /Users/pppgod/WorkBuddy/20260417110851/server
```

#### 4. 创建云托管服务
```bash
wxcloud run:create --name schedule-server --envId <你的环境ID>
```
> 环境 ID 可以在云托管控制台首页看到，格式类似 `prod-xxx`

#### 5. 直接推送代码部署
微信云托管支持「容器镜像」和「代码包」两种方式。因为我们已经有 Dockerfile，推荐**镜像方式**：

```bash
# 构建并推送镜像到微信云托管仓库
wxcloud run:deploy --name schedule-server --envId <你的环境ID> --dockerfile .
```

部署成功后，控制台会显示服务的**公网访问域名**，格式类似：
```
https://schedule-server-xxx-xxxx.gz.apigw.tencentcs.com
```

### 方式 B：通过控制台上传部署

1. 进入 [云托管控制台](https://cloud.weixin.qq.com/cloudrun)
2. 点击「新建服务」→ 服务名称填 `schedule-server`
3. 选择「镜像部署」
4. 可以先把 `server/` 目录打包，用「本地镜像构建」或「代码仓库」关联
5. 点击发布

---

## 四、配置环境变量

部署完成后，必须在云托管控制台配置环境变量，否则服务无法正常运行。

进入服务详情 → 「配置」→「环境变量」，添加以下变量：

| 变量名 | 值 | 说明 |
|---|---|---|
| `PORT` | `80` | 微信云托管默认监听 80 端口 |
| `WECHAT_APPID` | `wxbba514c6a919d753` | 小程序 AppID |
| `WECHAT_SECRET` | `fe5fc1e360863f21df50899990cdf1ea` | 小程序 Secret |
| `AI_API_KEY` | `sk-36333aab5fe74e569c805280d3d76acb` | DeepSeek API Key |
| `AI_BASE_URL` | `https://api.deepseek.com/v1` | DeepSeek Base URL |
| `AI_MODEL` | `deepseek-chat` | 模型名 |
| `WECHAT_TEMPLATE_ID` | `ib2N8c_bfewQB-zGs7a5bTLGQm_9CGwncb08h2h8hm8` | 订阅消息模板 ID |
| `JWT_SECRET` | 任意随机字符串 | 建议 32 位以上随机字符 |
| `DATA_DIR` | `/app/data` | SQLite 持久化目录 |

**注意：** 添加/修改环境变量后，需要**重新发布服务**才能生效。

---

## 五、配置数据库持久化（关键）

微信云托管的容器是**无状态**的，每次重新部署或容器重启后，容器内文件会丢失。如果不配置持久化，SQLite 数据库会清空。

### 配置持久化存储

1. 进入云托管控制台 → 你的服务 `schedule-server`
2. 点击「配置」→「存储」→「新建存储」
3. 名称填 `data`，挂载路径填 `/app/data`
4. 保存后重新发布服务

这样 SQLite 文件就会保存在持久化存储中，即使容器重启也不会丢失。

> 我们的 `server/db.js` 已经支持 `DATA_DIR` 环境变量，当设置为 `/app/data` 时，数据库会创建在持久化目录下。

---

## 六、更新小程序前端请求地址

部署成功后，你会得到一个**服务域名**。需要修改小程序代码：

打开 `miniapp/app.js`：

```javascript
App({
  globalData: {
    // 开发环境
    // apiBase: 'http://localhost:3000',
    
    // 微信云托管生产环境（替换成你的真实域名）
    apiBase: 'https://schedule-server-xxx-xxxx.gz.apigw.tencentcs.com',
    token: null
  },
  // ...
});
```

**在微信开发者工具中：**
1. 重新编译小程序
2. 进入「详情」→「本地设置」→ **取消勾选**「不校验合法域名、web-view...」
3. 进入「详情」→「项目设置」→「request 合法域名」，确认你的云托管域名已经自动加入（如果没有，去小程序后台手动配置）

---

## 七、配置小程序 request 合法域名

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入「开发」→「开发管理」→「开发设置」→「服务器域名」
3. 在「request 合法域名」中添加你的云托管域名：
   ```
   https://schedule-server-xxx-xxxx.gz.apigw.tencentcs.com
   ```
4. 保存后等待 5 分钟生效

---

## 八、真机预览

1. 微信开发者工具点击「真机调试」或「预览」
2. 扫描弹出的二维码
3. 在手机上测试登录、创建日程、日历切换等完整流程

---

## 九、后续运维

| 操作 | 路径 |
|---|---|
| 查看日志 | 云托管控制台 → 服务详情 → 日志 |
| 查看监控 | 云托管控制台 → 服务详情 → 监控 |
| 扩容/缩容 | 云托管控制台 → 服务详情 → 配置 → 实例规格 |
| 更新代码 | 重新执行 `wxcloud run:deploy` 或在控制台重新发布 |

---

## 常见问题

**Q：部署后数据库为空？**
A：没有正确挂载持久化存储。检查环境变量 `DATA_DIR` 是否为 `/app/data`，以及云托管控制台是否挂载了同名存储卷。

**Q：真机上提示网络错误？**
A：检查 `miniapp/app.js` 的 `apiBase` 是否已改为 HTTPS 域名，以及该域名是否已添加到小程序后台的 request 合法域名中。

**Q：订阅消息收不到？**
A：检查 `WECHAT_TEMPLATE_ID` 环境变量是否正确，以及用户是否已经授权订阅。可以在云托管日志中查看 `services/reminder.js` 的推送日志。

**Q：AI 解析失败？**
A：检查 `AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL` 三个环境变量是否正确，以及 DeepSeek 账户是否还有余额。
