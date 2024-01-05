require("dotenv").config();
const puppeteer = require("puppeteer");
const fs = require("fs");

console.log(process.env.DUMMY_API_KEY);

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function highlightElement(page, selector) {
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);

    if (element) {
      //   const originalBackgroundColor = element.style.backgroundColor;
      element.style.border = "3px solid maroon";

      //   setTimeout(() => {
      //     element.style.backgroundColor = originalBackgroundColor;
      //   }, 1000); // Adjust the timeout as needed
    }
  }, selector);
}

async function main() {
  //   const width = 1024,
  //      height = 600;
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false,
    defaultViewport: null,
    // defaultViewport: { width, height },
    devtools: false,
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

  await page.waitForTimeout(2000); // Adjust the timeout value as needed

  await page.waitForSelector("#controls");

  await page.click('#controls button[action="agree"]:first-child');

  await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  await page.waitForSelector("#system-broadcast-notification-dialog");
  await page.waitForSelector(".pull-right");
  await page.waitForTimeout(2500); // Adjust the timeout value as needed
  await page.click(
    '#system-broadcast-notification-dialog .modal-footer .clearfix .pull-right button[action="ok"]:first-child'
  );

  // at this point we are inside the dashboard now we have to navigate to build tab

  await page.waitForSelector(
    ".navbar .navbar-inner .container-fluid ul > li:first-child > a"
  );
  await page.click(
    ".navbar .navbar-inner .container-fluid ul > li:first-child > a"
  );

  // now we have navigated to the build tab now here we have to do all the selects and stuff

  //1. get all year values from select dropdown

  //   const yearOptions = await page.evaluate(() => {
  //     const selectElement = document.querySelector("#yearSelect");
  //     return Array.from(selectElement.options).map((option) => option.value);
  //   });

  //   await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  // from below lines of code we have an issue
  try {
    await page.waitForSelector(
      ".body-panel > .row-fluid:first-child > #year-type-filters > .pull-left:first-child > span"
    );
    await highlightElement(
      page,
      ".body-panel > .row-fluid:first-child > #year-type-filters > .pull-left:first-child > span"
    );
    // await page.click(
    //   "#year-type-filters > div:nth-child(1) > span > span > span.k-input"
    // );

    // await page.click("#year-type-filters .year-dropdown .k-dropdown-wrap");
  } catch (error) {
    console.log("err new", error);
  }

  await page.waitForSelector(
    ".body-panel > .row-fluid:nth-child(2) > #model-listView-container"
  );

  await highlightElement(
    page,
    ".body-panel > .row-fluid:nth-child(2) > #model-listView-container"
  );

  await page.waitForSelector("#model-listView > .vehicle-model:first-child");

  const vehiclesContainer = await page.$$(".vehicle-model");

  let vehicleList = [];

  for (const vehicle of vehiclesContainer) {
    let title,
      image = "";

    try {
      title = await vehicle.$eval("span", (element) =>
        element.textContent.trim()
      );
    } catch (error) {
      console.log("loop error title", error);
    }

    try {
      image = await vehicle.$eval("img", (element) => element.src);
    } catch (error) {
      console.log("loop error img", error);
    }

    vehicleList.push({ title, image });
  }

  console.log("final", vehicleList);

  //   console.log("yearOptions");
}

main().catch((e) => console.log(e));
