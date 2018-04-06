const GOALS = {
    store: new DataStore('goals'),

    /**
     * A caching wrapper around `document.getElementById()`.
     * @param {String} name
     * @returns {HTMLElement}
     */
    ui: (() => {
        const cache = {};
        return name => {
            if (!(name in cache)) {
                cache[name] = document.getElementById(name);
            }
            return cache[name];
        };
    })(),

    /**
     * Instantiates and returns the specified template.
     * @param {String} name
     * @returns {HTMLElement}
     */
    template(name)
    {
        const template = GOALS.ui('templates').import.querySelector(`#${name}`).content;
        return document.importNode(template, true).firstElementChild;
    },

    /**
     * Adds an event listener to the supplied input element that executes a callback when the ENTER key is pressed
     * @param {HTMLElement} input
     * @param {Function} callback
     */
    onEnter(input, callback)
    {
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                callback();
            }
        });
    }
};

window.addEventListener('load', () => {
    document.body.appendChild(GOALS.TaskList.create(GOALS.store, null));
});
