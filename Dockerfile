FROM zenika/alpine-chrome:with-puppeteer

WORKDIR /app

USER root
COPY package*.json yarn.lock ./
RUN yarn

COPY index.js .env ./

USER chrome
ENTRYPOINT ["node", "index.js"]