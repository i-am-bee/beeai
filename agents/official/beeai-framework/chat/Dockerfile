FROM node:20-alpine AS base

ENV APP_DIR=/home/node/app

WORKDIR ${APP_DIR}

FROM base AS builder

COPY package*.json ./
RUN npm install

COPY . ./
RUN npx tsc

RUN npm prune --production

FROM base AS runner

COPY --from=builder ${APP_DIR}/dist ./
COPY --from=builder ${APP_DIR}/node_modules ./node_modules

EXPOSE 8000

CMD [ "node", "./server.js" ]