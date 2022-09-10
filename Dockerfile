FROM node:alpine

WORKDIR /app

RUN npm i nunjucks axios

COPY app/ /app

EXPOSE 3000
CMD ["node", "index.js"]