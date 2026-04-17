#!/bin/bash
# 腾讯云服务器一键部署脚本（Ubuntu 22.04）

echo "=== 开始安装 Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "=== 安装 PM2 ==="
sudo npm install -g pm2

echo "=== 安装 Nginx ==="
sudo apt install -y nginx

echo "=== 安装 Certbot（Let's Encrypt）==="
sudo apt install -y certbot python3-certbot-nginx

echo "=== 申请 SSL 证书 ==="
sudo certbot --nginx -d longxiac.pppgod.com --non-interactive --agree-tos -m your-email@example.com

echo "=== 配置 Nginx ==="
sudo cp nginx-schedule.conf /etc/nginx/sites-available/longxiac.pppgod.com
sudo ln -sf /etc/nginx/sites-available/longxiac.pppgod.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

echo "=== 设置防火墙 ==="
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH

echo "=== 部署完成 ==="
echo "请将 server-deploy.zip 解压到 /opt/schedule-server，配置 .env 后用 PM2 启动"
