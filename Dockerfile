FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm install --omit=dev && mkdir -p tmp

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
