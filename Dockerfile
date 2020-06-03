FROM node:lts-alpine

WORKDIR /app
COPY . /app

RUN rm -rf package-lock.json \
    ; rm -rf node_modules \
    ; npm config set registry "https://registry.npm.taobao.org/" \
    && npm install

EXPOSE 8888
CMD ["node", "app.js"]
