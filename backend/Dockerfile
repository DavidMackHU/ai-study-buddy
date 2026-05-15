FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

FROM base AS dev
RUN npm install
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "run", "dev"]

FROM base AS builder
RUN npm install
RUN npx prisma generate
COPY src ./src
RUN npm run build

FROM node:22-alpine AS prod
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated
EXPOSE 3001
CMD ["node", "dist/index.js"]
