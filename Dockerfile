FROM node:20-slim

WORKDIR /app

# Only copy manifests first (caches npm install layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source
COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
