require("dotenv").config();
const puppeteer = require("puppeteer");
const fs = require("fs");

console.log(process.env.DUMMY_API_KEY);

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function main() {
  //   const width = 1024,
  //      height = 600;
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false,
    defaultViewport: null,
    // defaultViewport: { width, height },
    devtools: true,
  });

  const page = await browser.newPage();
  //   await page.setViewport({ width, height });

  page.setDefaultNavigationTimeout(90000);

  await page.goto("https://www.fordctt.dealerconnection.com/build/vehicle.do");

  //   await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  //   page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

  // The signin where three sign in options are shown in which we have to select the 2nd one (i.e Dealer,Supplier, Other Login)
  await page.waitForSelector("#bySelection > div:nth-child(4)");
  await page.click("#bySelection > div:nth-child(4)");

  //   const pages = await browser.pages();
  //   let currentPage = pages[pages.length - 1];

  await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  await page.type("#userName[type=text]", process.env["FORD_UNAME"]);
  await page.type("#password[type=password]", process.env["FORD_PASS"]);

  await page.click("#btn-sign-in[type=submit]");

  //   await page.goto(
  //     "https://www.fordctt.dealerconnection.com/dashboard/?locale=en_US"
  //   );

  //   const pages = await browser.pages();
  //   let currentPage = pages[pages.length - 1];

  // logged in now handling first popup and click on agree

  await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  try {
    await page.waitForSelector("#controls");
    console.log("Button found, clicking...");
    await page.waitForTimeout(2000); // Adjust the timeout value as needed
    await page.click('#controls button[action="agree"]:first-child');

    // await page.waitForSelector('button[action="agree"]');
  } catch (error) {
    console.log("here error", error);
  }

  await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  try {
    await page.waitForSelector("#system-broadcast-notification-dialog");
    await page.waitForTimeout(2000); // Adjust the timeout value as needed
    await page.waitForSelector("a.close");

    await page.click("a.close");
    console.log("Button clicked.");
  } catch (error) {
    console.log("here error 2", error);
  }

  //   await browser.close();

  //   await currentPage.waitForSelector("button[action=ok]");
  //   await currentPage.click("button[action=ok]");
}

main().catch((e) => console.log(e));
