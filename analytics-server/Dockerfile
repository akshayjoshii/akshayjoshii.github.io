FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY src ./src

RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 8787

CMD ["node", "src/server.js"]
