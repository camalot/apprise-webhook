FROM node:alpine

WORKDIR /app

RUN npm i nunjucks axios

COPY app/* /app/

EXPOSE 8001
CMD ["node", "index.js"]
