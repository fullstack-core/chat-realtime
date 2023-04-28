# build stage
FROM node:16.13.0-alpine3.14 as build-stage

WORKDIR /app

COPY . .

RUN npx pnpm install

RUN npx pnpm build

# production stage
FROM node:16.13.0-alpine3.14 as production-stage

WORKDIR /app

RUN chown -R node:node /app

USER node

RUN mkdir dist

COPY --chown=node:node ./package.json ./pnpm-lock.yaml ./

COPY --chown=node:node ./prisma/ ./

COPY --chown=node:node --from=build-stage /app/dist /app/dist

RUN npx pnpm install -P

RUN npx prisma generate

CMD [ "node", "/app/dist/src/main.js" ]
