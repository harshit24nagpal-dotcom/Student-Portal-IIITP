# Multi-stage Dockerfile for IIIT Pune Campus Connect

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime Backend
FROM node:20-alpine AS runner
WORKDIR /app

# Install openssl for Prisma on Alpine
RUN apk add --no-cache openssl

# Set Environment
ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL="file:./dev.db"

# Install root & backend dependencies
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install --omit=dev
RUN npm --prefix backend install --omit=dev

# Copy backend source & prisma
COPY backend ./backend

# Generate Prisma Client & seed database
WORKDIR /app/backend
RUN npx prisma generate
RUN npx prisma db push
RUN node prisma/seed.js

# Copy built frontend assets to the frontend dist folder
WORKDIR /app
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 5000

CMD ["npm", "start"]
