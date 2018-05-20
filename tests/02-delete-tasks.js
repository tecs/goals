module.exports = it => {
    let callback;
    const dialog = {
        accept: () => callback = dialog => dialog.accept(),
        reject: () => callback = dialog => dialog.dismiss()
    };

    const dialogListener = async dialog => {
        if (callback) {
            const cb = callback;
            callback = null;
            return await cb(dialog);
        }
        dialog.dismiss();
        throw 'Unhandled dialog';
    }


    it('can be cancelled', async page => {
        await page.type('input', 'Task Foo');
        await page.click('button');
        await page.click('.taskOverlay');
        await page.type('.taskWrap .addTask input', 'Task Bar');
        await page.click('.taskWrap .addTask button');
        await page.click('.taskWrap .taskWrap .taskOverlay');
        await page.type('.taskWrap .taskWrap .addTask input', 'Task Baz');
        await page.click('.taskWrap .taskWrap .addTask button');

        page.on('dialog', dialogListener);

        await page.click('.taskWrap .taskWrap .taskWrap .taskOverlay');
        dialog.reject();
        await page.click('.taskWrap .taskWrap .taskWrap .task button');

        await expect(page).toMatchElement('.taskWrap .taskWrap .taskWrap');
    });


    it('works for tasks with no children', async page => {
        dialog.accept();
        await page.click('.taskWrap .taskWrap .taskWrap .task button');

        await expect(page).not.toMatchElement('.taskWrap .taskWrap .taskWrap');
    });

    it('works for tasks with children', async page => {
        const task = await page.$('.task');
        await task.hover();
        const button = await task.$('button');
        dialog.accept();
        await button.click();

        await expect(page).not.toMatchElement('.taskWrap');
    });

    it('persists on reloading the page', async page => {
        await page.reload();
        await page.waitForSelector('.taskList');

        await expect(page).not.toMatchElement('.taskWrap');
    });
};
