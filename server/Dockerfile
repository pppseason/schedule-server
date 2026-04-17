FROM node:20
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN npm install --production
COPY . .
RUN mkdir -p /data
EXPOSE 80
CMD ["node", "app.js"]
