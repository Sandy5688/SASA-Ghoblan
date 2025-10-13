import { chromium } from "playwright";

export const login = async (email, password) => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto("https://audiomack.com/login");

    await page.fill('input[name="username"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000); // wait for login completion

    const loggedIn = await page.$('text=Logout') !== null;
    return { browser, page, loggedIn };
  } catch (err) {
    await browser.close();
    throw err;
  }
};
