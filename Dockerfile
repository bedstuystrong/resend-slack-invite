FROM zenika/alpine-chrome:with-puppeteer

WORKDIR /app

USER root
COPY package*.json yarn.lock ./
RUN yarn

COPY *.js .env* ./

USER chrome
ENTRYPOINT ["node", "index.js"]