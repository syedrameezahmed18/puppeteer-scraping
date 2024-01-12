require("dotenv").config();
const puppeteer = require("puppeteer");

const { MongoClient } = require("mongodb");

console.log(process.env.DUMMY_API_KEY || "");

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

  const databaseUrl = "mongodb://localhost:27017";
  const dbName = "ford-scrap";
  const collectionName = "vehicles";

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false,
    defaultViewport: null,
    // defaultViewport: { width, height },
    devtools: false,
  });

  async function testConnection() {
    const url = "mongodb://localhost:27017";

    const client = new MongoClient(url);

    try {
      await client.connect();
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error.message);
    } finally {
      await client.close();
    }
  }

  //   testConnection();

  deleteAllDataInCollectionMongoDB(databaseUrl, dbName, collectionName);

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

  await page.waitForTimeout(2500); // Adjust the timeout value as needed

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

  let vehicleList = [];

  await page.waitForTimeout(5000)

  try {
    await page.waitForSelector(
      ".body-panel > .row-fluid:first-child > #year-type-filters > .pull-left:first-child > span"
    );
    await highlightElement(
      page,
      ".body-panel > .row-fluid:first-child > #year-type-filters > .pull-left:first-child > span"
    );

    let yearDropDownSpan = await page.$(
      "#year-type-filters > .pull-left:first-child > span"
    );

    await yearDropDownSpan.evaluate((a) => a.click());

    await page.waitForSelector("#year-dropdown-list ul li", { visible: true });

    const yearElements = await page.$$("#year-dropdown-list ul li");

    // Loop through each li element and get its text content
    // for (const yearElement of yearElements) {
    //   const year = await page.evaluate(
    //     (element) => element.textContent,
    //     yearElement
    //   );

    //   console.log('dropdown options',year)
    // }


    for (let i = 0; i < yearElements.length; i++) {
      const year = await page.evaluate(
        (element) => element.textContent,
        yearElements[yearElements.length - 1]
      );

      let dropDownValueSelect = await page.$(
        `#year-dropdown-list ul li:nth-child(${(
          yearElements.length - i
        ).toString()})`
      );

      // console.log(
      //   "new",
      //   dropDownValueSelect,
      //   `#year-dropdown-list ui li:nth-child(${(
      //     yearElements.length - i
      //   ).toString()})`
      // );
      await dropDownValueSelect.evaluate((a) => a.click());

      await page.waitForTimeout(1000);

      let typeDropDownSpan = await page.$(
        "#year-type-filters > .pull-left:nth-child(2) > span"
      );

      await typeDropDownSpan.evaluate((a) => a.click());

      await page.waitForSelector("#type-dropdown-list ul li", {
        visible: true,
      });

      const typeElements = await page.$$("#type-dropdown-list ul li");

      console.log("eval", year, typeElements.length);

      for (let j = 0; j < typeElements.length; j++) {
        const type = await page.evaluate(
          (element) => element.textContent,
          typeElements[j]
        );

        console.log("evalnew", year, typeElements.length);

        const typeSelect = await page.$(
          `#type-dropdown-list ul li:nth-child(${(j + 1).toString()})`
        );

        await typeSelect.evaluate((a) => a.click());

        await page.waitForSelector(
          "#model-listView > .vehicle-model:first-child"
        );

        const vehiclesContainer = await page.$$(".vehicle-model");

        for (let k=0; k <vehiclesContainer.length; k++) {
          let title,
            image = "";

          try {
            title = await vehiclesContainer[k].$eval("span", (element) =>
              element.textContent.trim()
            );
          } catch (error) {
            console.log("loop error title", error);
          }

          try {
            image = await vehiclesContainer[k].$eval("img", (element) => element.src);
          } catch (error) {
            console.log("loop error img", error);
          }

          // new logic to now click on each vehicle that would open the trim section and in that get all the trim variants in array
          // of objects having details body, trim description, pl, msrp
          try {
            
            const vehicleSelect = await page.$(
              `#model-listView > .vehicle-model:nth-child(${(k+1).toString()})`
            )
  
            await vehicleSelect.evaluate((a)=> a.click());
          } catch (error) {
            console.log("vehicleSelect err:",{vehicleSelect})
          }

          //in the second and above loops there might appear a popup box with id quoteDlg

          await sleep(2000);

          try {
            const waitResult = await page.waitForSelector("#quoteDlg", {visible:true, timeout: 5000 });
            console.log("%cwaitResult:",'background-color:green;color:white;',{waitResult})
            const highElementRes = await highlightElement(page, "#quoteDlg > div.modal-footer")
            console.log("%chighElementRest:",'background-color:green;color:white;',{highElementRes})
            const quoteDialogBtn = await page.$("#quoteDlg > div.modal-footer > div > div > button:nth-child(2)")
            console.log("%cquoteDialogBtnt:",'background-color:green;color:white;',{quoteDialogBtn})
            if (quoteDialogBtn) {
// If the popup appears, click on its child component
await quoteDialogBtn.evaluate((a) => a.click())
            }
          }
          catch (e) {
            console.log('%cno quote modal','background-color:red;color:white;',e)
          }

      
          // // just to properly load the trim section
          // await page.waitForTimeout(100)

          //getting the trim table tr
          await page.waitForSelector(
            "tbody > tr", {visible: true}
          )
          const trims = await page.$$("tbody > tr")

          let trimList = []

          for (let trim=0; trim<trims.length; trim++) {
           
            console.log('trim index is',trim,trims.length, trims[trim])

            await page.waitForSelector("tbody > tr")

            await page.waitForSelector(
              `tbody > tr:nth-child(${(trim+1).toString()}) > td:nth-child(1)`, {visible: true}
            )
            let body, trimDescription, pl, msrp = ''
            await sleep(3000)
            try {
              body = await trims[trim].$eval("td:nth-child(2)", (element) =>
                element.textContent.trim()
              );
            } catch (error) {
              console.log("loop error body", error);
            }

            try {
              trimDescription = await trims[trim].$eval("td:nth-child(3)", (element) =>
                element.textContent.trim()
              );
            } catch (error) {
              console.log("loop error desc", error);
            }

            try {
              pl = await trims[trim].$eval("td:nth-child(4)", (element) =>
                element.textContent.trim()
              );
            } catch (error) {
              console.log("loop error pl", error);
            }

            try {
              msrp = await trims[trim].$eval("td:nth-child(6) > div", (element) =>
                element.textContent.trim()
              );
            } catch (error) {
              console.log("loop error body", error);
            }


            // now from this point onwards we need to click each radio button which would navigate to the main detail list

            await page.waitForSelector(
              "tbody > tr", {visible: true}
            )

            await page.waitForSelector("td:nth-child(1) > input")

            await highlightElement(page, "td:nth-child(1)")
            const trimRadioButton = await page.$(`tr:nth-child(${(trim+1).toString()}) td:nth-child(1) > input`)

            console.log('tb',trimRadioButton)

            await trimRadioButton.evaluate((a) => a.click())

            try {
             page.waitForSelector("#quoteDlg", {visible:true, timeout: 5000 }).then(async()=> {
              console.log("waitForSeletor then::::::::")
              const quoteDialogBtn = await page.$("#quoteDlg > div.modal-footer > div > div > button:nth-child(2)")
              console.log("%cquoteDialogBtnt:",'background-color:green;color:white;',{quoteDialogBtn})
              if (quoteDialogBtn) {
                // If the popup appears, click on its child component
                await quoteDialogBtn.evaluate((a) => a.click())
                            }
             }).catch(e => {
              console.log("waitForSelector error::::::::",e)
             });
  //             console.log("%cwaitResult:",'background-color:green;color:white;',{waitResult})
  //             const highElementRes = await highlightElement(page, "#quoteDlg > div.modal-footer")
  //             console.log("%chighElementRest:",'background-color:green;color:white;',{highElementRes})
  //             const quoteDialogBtn = await page.$("#quoteDlg > div.modal-footer > div > div > button:nth-child(2)")
  //             console.log("%cquoteDialogBtnt:",'background-color:green;color:white;',{quoteDialogBtn})
  //             if (quoteDialogBtn) {
  // // If the popup appears, click on its child component
  // await quoteDialogBtn.evaluate((a) => a.click())
  //             }
            }
            catch (e) {
              console.log('%cno quote modal','background-color:red;color:white;',e)
            }

            await page.waitForNavigation({ waitUntil: "domcontentloaded" });

            await page.waitForSelector("#container-options > #panels:nth-child(3)")

            const mainBuildOptions = await page.$$("#panels:nth-child(3) > .panel")

            let additionalOptions = {}

            for (let buildOptionIndex=0; buildOptionIndex<mainBuildOptions.length; buildOptionIndex++) {
              let code, description, msrp, invoice, dealer = ''
              let key = ''

              key = await mainBuildOptions[buildOptionIndex].$eval(".well > .container-panel > .header-panel > .clearfix > .pull-left > h5",(element)=> element.textContent.trim())
              additionalOptions['property'] = key
            }

            // till this point
            trimList.push({body, trimDescription, pl ,msrp, additionalOptions})

            // now go back to original page

            await page.waitForSelector("#sidebar > #sidebar-contents")
            const buildSidebarBtn = await page.$("#sidebar > #sidebar-contents > li:first-child > a")
            await buildSidebarBtn.evaluate((a) => a.click())

            //here we are at a point where we have selected a vehicle we got all the trim info we navigated to the option page and now we 
            // are back to the vehicles page here however we can find a popup showing to remove the current quote first before selecting the next vehicle

            await page.waitForNavigation({ waitUntil: "domcontentloaded" });

           
            await page.waitForSelector(
              ".body-panel > .row-fluid:first-child > #year-type-filters > .pull-left:first-child > span"
            ); 

            
            await page.waitForSelector("tbody > tr")

            await page.waitForSelector(
              `tbody > tr:nth-child(${(trim+1).toString()}) > td:nth-child(1)`, {visible: true}
            )

  //           await page.waitForSelector(
  //             `#model-listView > .vehicle-model:nth-child(${(k+1).toString()})`
  //           )

  //           await yearDropDownSpan.evaluate((a) => a.click());

  //           await dropDownValueSelect.evaluate((a) => a.click());

  //           await page.waitForTimeout(1000);

  //           await typeDropDownSpan.evaluate((a) => a.click());

  //           await page.waitForSelector("#type-dropdown-list ul li", {
  //             visible: true,
  //           });

  //           await typeSelect.evaluate((a) => a.click());

  //           await page.waitForSelector(
  //             "#model-listView > .vehicle-model:first-child"
  //           );

  //           await vehicleSelect.evaluate((a)=> a.click());

  //           await sleep(2000);

  //           try {
  //             const waitResult = await page.waitForSelector("#quoteDlg", {visible:true, timeout: 5000 });
  //             console.log("%cwaitResult:",'background-color:green;color:white;',{waitResult})
  //             const highElementRes = await highlightElement(page, "#quoteDlg > div.modal-footer")
  //             console.log("%chighElementRest:",'background-color:green;color:white;',{highElementRes})
  //             const quoteDialogBtn = await page.$("#quoteDlg > div.modal-footer > div > div > button:nth-child(2)")
  //             console.log("%cquoteDialogBtnt:",'background-color:green;color:white;',{quoteDialogBtn})
  //             if (quoteDialogBtn) {
  // // If the popup appears, click on its child component
  // await quoteDialogBtn.evaluate((a) => a.click())
  //             }

  //             await page.waitForSelector(
  //               "tbody > tr", {visible: true}
  //             )
  //           }
  //           catch (e) {
  //             console.log('%cno quote modal','background-color:red;color:white;',e)
  //           }



            await sleep(2000);

            
          }

          vehicleList.push({ title, image, trimList });
        }
      }

      console.log('main list',vehicleList)

      await yearDropDownSpan.evaluate((a) => a.click());

      await page.waitForSelector("#year-dropdown-list ul li", {
        visible: true,
      });
    }

    // await page.click("#year-type-filters .year-dropdown .k-dropdown-wrap");
  } catch (error) {
    console.log("err new", error);
  }

  // console.log("endgame", vehicleList);

  await page.waitForSelector(
    ".body-panel > .row-fluid:nth-child(2) > #model-listView-container"
  );

  await highlightElement(
    page,
    ".body-panel > .row-fluid:nth-child(2) > #model-listView-container"
  );

  // await page.waitForSelector("#model-listView > .vehicle-model:first-child");

  // const vehiclesContainer = await page.$$(".vehicle-model");

  // let vehicleList = [];

  // for (const vehicle of vehiclesContainer) {
  //   let title,
  //     image = "";

  //   try {
  //     title = await vehicle.$eval("span", (element) =>
  //       element.textContent.trim()
  //     );
  //   } catch (error) {
  //     console.log("loop error title", error);
  //   }

  //   try {
  //     image = await vehicle.$eval("img", (element) => element.src);
  //   } catch (error) {
  //     console.log("loop error img", error);
  //   }

  //   vehicleList.push({ title, image });
  // }
  //   console.log("final", vehicleList);

  // Store data in MongoDB

    console.log('final vec',vehicleList)

  await storeDataInMongoDB(vehicleList, databaseUrl, dbName, collectionName);

  await browser.close();

  console.log("yearOptions");
}

async function storeDataInMongoDB(data, databaseUrl, dbName, collectionName) {
  const client = new MongoClient(databaseUrl);

  try {
    await client.connect();
    console.log("Connected to the database");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Insert the data into the MongoDB collection
    await collection.insertMany(data);

    console.log("Data stored in MongoDB");
  } finally {
    await client.close();
  }
}

async function deleteAllDataInCollectionMongoDB(
  databaseUrl,
  dbName,
  collectionName
) {
  const client = new MongoClient(databaseUrl);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collections = await db.listCollections({ name: collectionName }).toArray();

    if (collections.length === 0) {
      console.log(`Collection '${collectionName}' does not exist. Creating...`);
      await db.createCollection(collectionName);
      console.log(`Collection '${collectionName}' created.`);
    }

    const collection = db.collection(collectionName);

    const deleteResult = await collection.deleteMany({});
    console.log(`${deleteResult.deletedCount} documents deleted`);
  } catch (error) {
    console.error("Error deleting documents:", error);
  } finally {
    // Close the MongoDB connection
    await client.close();
  }
}

main().catch((e) => console.log(e));
