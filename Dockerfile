FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY .npmrc ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY --from=build /app/dist ./dist
COPY server/ ./server/
COPY database/ ./database/
COPY server.js ./

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "server.js"]
