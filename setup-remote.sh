#!/bin/bash
set -e

exec > /opt/schedule-server/setup.log 2>&1
set -x

echo "=== $(date) 开始部署 ==="

# 1. 安装基础环境
echo "[1/7] 安装 Node.js 20..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" != "20" ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "[2/7] 安装 Nginx、Certbot、PM2..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx
npm install -g pm2

echo "[3/7] 解压后端代码..."
cd /opt/schedule-server
unzip -o server-deploy.zip
cd server
npm install --production

echo "[4/7] 创建 .env 配置文件..."
cat > /opt/schedule-server/server/.env << 'EOF'
PORT=3000
WECHAT_APPID=wxbba514c6a919d753
WECHAT_SECRET=fe5fc1e360863f21df50899990cdf1ea
AI_API_KEY=sk-36333aab5fe74e569c805280d3d76acb
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
WECHAT_TEMPLATE_ID=ib2N8c_bfewQB-zGs7a5bTLGQm_9CGwncb08h2h8hm8
JWT_SECRET=VZYn+WB4dAcHJU0jh0KgfjQrukqslI9fEX5qzBreF80=
DATA_DIR=/opt/schedule-server/server/data
EOF

echo "[5/7] 配置 Nginx..."
cat > /etc/nginx/sites-available/longxiac.pppgod.com << 'EOF'
server {
    listen 80;
    server_name longxiac.pppgod.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name longxiac.pppgod.com;

    ssl_certificate /etc/letsencrypt/live/longxiac.pppgod.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/longxiac.pppgod.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/longxiac.pppgod.com /etc/nginx/sites-enabled/

echo "[6/7] 申请 SSL 证书并启动服务..."
# 创建 certbot webroot
mkdir -p /var/www/certbot

# 先启动后端，让服务可用，再申请证书（certbot 需要 80 端口）
cd /opt/schedule-server/server
pm2 delete schedule-server 2>/dev/null || true
pm2 start app.js --name schedule-server

# 申请证书
systemctl stop nginx || true
certbot certonly --standalone -d longxiac.pppgod.com --non-interactive --agree-tos -m admin@longxiac.pppgod.com || true
systemctl start nginx || nginx

# 检查 nginx 配置
nginx -t && systemctl restart nginx

echo "[7/7] 保存 PM2 配置..."
pm2 save
pm2 startup systemd -u root --hp /root || true

echo "=== $(date) 部署完成 ==="
echo "访问测试: https://longxiac.pppgod.com/"
