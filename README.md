# docker-apprise-webhook

Webhook receiver for [Apprise](https://github.com/caronc/apprise)

_A 'fork' of [the original by zzeneg](https://hub.docker.com/r/zzeneg/apprise-webhook), as I couldn't find the original repo, and it wasn't working so I wanted to track down why_

Allows to receive JSON messages and send them to [Apprise API](https://github.com/caronc/apprise-api) using a custom template.

## Requirements

- Installed Apprise API
- A template for converting a message from webhook. Templates are using [nunjucks](https://mozilla.github.io/nunjucks/) templating engine.
  Built-in templates:

  - `alertmanager` - [Prometheus Alertmanager](https://github.com/prometheus/alertmanager) template
  - `diun` - [diun](https://github.com/crazy-max/diun) template

  These templates use Markdown formatting and may not be suitable for all notification services. You can create your own templates and mount them as volumes to `/app/templates/` folder.

## Usage

- Default address is `http://apprise-webhook:8001`. You can customise the behavior using query parameters:
  - `template` - template name which should be used (excluding `.njk`)
  - `key` - key to append to Apprise URL (e.g. `http://apprise:8000/notify/key`)
  - `title` - title to pass to Apprise API
  - `type` - type to pass to Apprise API
  - `tag` - tag to pass to Apprise API
- Environment variables
  - `APPRISE_URL` - Apprise API URL (**required**)
  - `TEMPLATE` - Default template (**required if** `template` query parameter is not used)
  - `APPRISE_KEY` - Default key for Apprise API (_optional_)
  - `NODE_PORT` - The port to listen (_optional_ - default: 8001)
  - `NODE_HOST` - The IP to bind to (_optional_ - default: '0.0.0.0')
- docker-compose example

  ```yaml
  apprise:
    container_name: apprise
    image: caronc/apprise
    restart: unless-stopped
    environment:
      APPRISE_STATELESS_URLS: tgram://${TELEGRAM_LOGGER_TOKEN}/${TELEGRAM_LOGGER_CHATID}?format=markdown

  apprise-webhook:
    container_name: apprise-webhook
    image: ghcr.io/camalot/apprise-webhook:latest
    restart: unless-stopped
    environment:
      APPRISE_URL: http://apprise:8000/notify/
      TEMPLATE: mywebhook
      APPRISE_KEY: logger
    volumes:
      - ./mywebhook.njk:/app/templates/mywebhook.njk #custom template
  ```

- Alertmanager configuration (`alertmanager.yml`)

  ```yaml
  route:
    receiver: "apprise"

  receivers:
    - name: "apprise"
      webhook_configs:
        - send_resolved: true
          url: http://apprise-webhook:8001?template=alertmanager&key=logger
  ```

- Diun configuration (`diun.yml`)
  ```yaml
  notif:
    webhook:
      enable: true
      endpoint: http://apprise-webhook:8001?template=diun&title=*Diun*
      method: POST
  ```
