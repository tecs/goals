const gulp = require('gulp');
const puppeteer = require('puppeteer');

require('../gulpfile');

gulp.start('webserver');

const browserPromise = puppeteer.launch({executablePath: '/usr/bin/chromium-browser'});
const pagePromise = browserPromise
    .then(browser => browser.newPage())
    .then(async page => {
        let loaded = true;
        while (!loaded) {
            loaded = true;
            await page.goto('http://localhost:8000').catch(e => loaded = false);
        }
        return page;
    });

beforeAll(async done => {
    await pagePromise;
    done();
}, 20000);

afterAll(() => {
    gulp.start('webserver-kill');
    browserPromise.then(browser => browser.close());
});

const setup = name => () => require(`./${name}`)(
    pagePromise.then(async page => {
        await page.reload();
        await page.waitForSelector('.taskList');
        return page;
    })
);
