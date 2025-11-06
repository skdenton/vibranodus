FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    libstdc++ \
    libc6-compat

COPY package*.json ./

RUN npm install --omit=dev && mkdir -p tmp

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
