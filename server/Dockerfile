# Server Dockerfile - Node.js + Prisma Backend
FROM node:18-alpine

WORKDIR /app

# Copy package management files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma Client
RUN npm ci --only=production
RUN npx prisma generate

# Copy application source code
COPY . .

# Expose backend API port
EXPOSE 5001

# Start backend server
CMD ["node", "src/server.js"]
