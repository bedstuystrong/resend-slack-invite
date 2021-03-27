const puppeteer = require('puppeteer');

const SLACK_URL = process.env.SLACK_URL;
const successText = 'You have already been invited to join this team. We have sent the invitation email again for you.';

const resendInvite = async (email) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--disable-gpu', '--no-sandbox'],
    });
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

module.exports = {
  resendInvite,
};