FROM node:16-alpine

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --production

COPY challenge2016 .

CMD ["npm", "start"]
