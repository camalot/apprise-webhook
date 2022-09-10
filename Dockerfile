FROM node:alpine

ARG PROJECT_NAME
ARG BUILD_VERSION

WORKDIR /app

RUN npm i nunjucks axios

COPY app/* /app/

EXPOSE 8001
CMD ["node", "index.js"]
