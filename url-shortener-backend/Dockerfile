### BUILD ENVIRONMENT ###

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

RUN npm ci --omit=dev && npm cache clean --force

### PRODUCTION RUNTIME ###
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
