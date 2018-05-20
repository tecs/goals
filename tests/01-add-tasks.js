module.exports = it => {
    it('works for root tasks', async page => {
        await page.type('input', 'Task Foo');
        await page.click('button');

        await expect(page.$eval('.task input[type=text]', e => e.value))
            .resolves.toBe('Task Foo');
    });

    it('works for sub-tasks', async page => {
        await page.click('.taskOverlay');
        await page.type('.taskWrap .addTask input', 'Task Bar');
        await page.click('.taskWrap .addTask button');

        await expect(page.$eval('.taskWrap .taskWrap .task input[type=text]', e => e.value))
            .resolves.toBe('Task Bar');
    });

    it('works using the <Return> key', async page => {
        await page.click('.taskWrap .taskWrap .taskOverlay');
        await page.$('.taskWrap .taskWrap .addTask input').then(async input => {
            await input.type('Task Baz');
            await input.press('Enter');
        });

        await expect(page.$eval('.taskWrap .taskWrap .taskWrap .task input[type=text]', e => e.value))
            .resolves.toBe('Task Baz');
    });

    it('persists on reloading the page', async page => {
        await page.reload();
        await page.waitForSelector('.taskList');

        await expect(page.$eval('.task input[type=text]', e => e.value))
            .resolves.toBe('Task Foo');

        await expect(page.$eval('.taskWrap .taskWrap .task input[type=text]', e => e.value))
            .resolves.toBe('Task Bar');

        await expect(page.$eval('.taskWrap .taskWrap .taskWrap .task input[type=text]', e => e.value))
            .resolves.toBe('Task Baz');
    });
};
