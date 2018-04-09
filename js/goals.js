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
     * Generates a new UUID
     * @returns {String}
     */
    id: (() => {
        let i;

        const random = () => Math.round(Math.random() * 1e12);
        const inc = () => i < 1e12 ? ++i : i = 0;

        i = random();

        return () => {
            return [Date.now(), inc(), random()]
                .map(number => `${number.toString(16)}`.slice(-11))
                .map(hex => `00000000000${hex}`.slice(-11))
                .join('-');
        }
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
    document.body.appendChild(GOALS.TaskList.create(GOALS.store, null).element);
});
