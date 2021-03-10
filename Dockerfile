FROM zenika/alpine-chrome:with-puppeteer

WORKDIR /app

COPY package*.json yarn.lock ./
RUN yarn

COPY index.js .env ./

ENTRYPOINT ["node", "index.js"]