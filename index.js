require('dotenv').config();
const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser');
const bearerToken = require('express-bearer-token');

const app = express();
app.use(bodyParser.json());
app.use(bearerToken());

const PORT = process.env.PORT || 3000;
const SLACK_URL = process.env.SLACK_URL;
const TOKEN = process.env.TOKEN;
const successText = 'You have already been invited to join this team. We have sent the invitation email again for you.';

const resendInvite = async (email) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`${SLACK_URL}/forgot/reset`);
    await page.type('#email', email);
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const element = await page.$('#page_contents');
    const text = await element.evaluate(node => node.innerText);

    await browser.close();

    return text && text.includes(successText);
  } catch (e) {
    console.error(e);
    await browser.close();
  }
};

app.use((req, res, next) => {
  console.log(req.token, TOKEN)
  if (req.token !== TOKEN) {
    res.status(401).send('Unauthorized');
  } else {
    next();
  }
});

app.post('/resend', async (req, res) => {
  const email = req.body.email;

  if (!email) {
    res.status(400).send('Bad request');
    return;
  }

  const ok = await resendInvite(email);
  if (ok) {
    res.send(200);
  } else {
    res.status(400).send('Invite re-send failed');
  }
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
