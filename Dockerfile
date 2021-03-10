FROM zenika/alpine-chrome:with-puppeteer

USER node
WORKDIR /app

COPY package*.json yarn.lock ./
RUN yarn

COPY index.js .env ./

ENTRYPOINT ["node", "index.js"]