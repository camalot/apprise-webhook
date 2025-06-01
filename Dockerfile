FROM node:alpine

ARG PROJECT_NAME
ARG BUILD_VERSION

WORKDIR /app

RUN apk add --no-cache curl && npm i nunjucks axios

COPY app/* /app/
COPY templates/* /app/templates/

HEALTHCHECK \
	--interval=30s \
	--timeout=30s \
	--start-period=5s \
	--retries=3 \
	CMD [ "curl", "-f", "http://127.0.0.1:8001/healthz" ]

EXPOSE 8001
CMD ["node", "index.js"]
