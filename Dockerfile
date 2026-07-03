FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
RUN npm ci

COPY backend ./backend
RUN npm run db:generate --workspace @cantus/backend

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
