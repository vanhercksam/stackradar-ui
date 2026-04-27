FROM node:22-alpine AS builder

RUN apk upgrade --no-cache

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22-alpine

RUN apk upgrade --no-cache

WORKDIR /app

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm install --omit=dev

EXPOSE 3000
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
