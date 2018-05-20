const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const original_describe = describe;
global.describe = (name, file) => {
    const basePromise = new Promise(async (resolve, reject) => {
        const browser = await puppeteer.launch({executablePath: '/usr/bin/chromium-browser'});
        const page = await browser.newPage();
        await page.goto('http://localhost:8000/index.html');
        await page.waitForSelector('.taskList');
        resolve([page, browser]);
    });

    let tests = 0;
    let testPromise = basePromise;

    const replacementIt = (testName, callback) => {
        ++tests;

        it(testName, () => testPromise = testPromise.catch(() => basePromise).then(async ([page, browser]) => {
            let error;
            try {
                await callback(page, browser);
            } catch (e) {
                const dir = path.join(__dirname, '..', 'screenshots');
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
                const screenshotName = `${name} ${testName}`
                    .toLowerCase()
                    .replace(/[^a-z0-9]{1,}/g, ' ')
                    .trim()
                    .replace(/ /g, '-');
                await page.screenshot({path: path.join(dir, `${screenshotName}.png`)});
                error = e;
            }

            if (!--tests) {
                browser.close();
            }

            if (error) {
                throw error;
            }

            return [page, browser];
        }));
    };

    original_describe(name, () => require(`./${file}`)(replacementIt));
};

describe('Adding tasks', '01-add-tasks');
describe('Deleting tasks', '02-delete-tasks');
