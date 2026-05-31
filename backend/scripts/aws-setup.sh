#!/bin/bash
# Syllabrix Backend — AWS EC2 Ubuntu Setup Script
# Run this on a fresh Ubuntu 22.04 t2.micro instance

set -e

echo "=== [1/7] Updating system ==="
sudo apt-get update -y && sudo apt-get upgrade -y

echo "=== [2/7] Installing Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "=== [3/7] Installing Git, nginx, PM2 ==="
sudo apt-get install -y git nginx
sudo npm install -g pm2

echo "=== [4/7] Cloning repository ==="
cd /home/ubuntu
git clone https://github.com/369Adarsh/SyllabrixERP.git syllabrix
cd syllabrix/backend

echo "=== [5/7] Installing dependencies ==="
npm install --omit=dev
npx prisma generate

echo "=== [6/7] Configuring nginx ==="
sudo tee /etc/nginx/sites-available/syllabrix > /dev/null <<'NGINX'
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/syllabrix /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
sudo systemctl enable nginx

echo "=== [7/7] Setting up PM2 startup ==="
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | sudo bash

echo ""
echo "=== Setup complete! ==="
echo "Next step: create your .env.production file, then run:"
echo "  cd /home/ubuntu/syllabrix/backend"
echo "  pm2 start ecosystem.config.js"
echo "  pm2 save"
