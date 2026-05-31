FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# Run as non-root
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

# Cloud Run injects PORT automatically
ENV PORT=8080
EXPOSE 8080

CMD ["node", "src/server.js"]
