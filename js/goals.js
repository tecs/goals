const GOALS = {
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

    createTaskList()
    {
        const taskList = GOALS.template('taskList');
        const addTask = GOALS.template('addTask');
        const tasks = taskList.querySelector('.tasks');

        taskList.insertBefore(addTask, tasks);

        addTask.querySelector('button').addEventListener('click', () => {
            const task = GOALS.template('task');
            const input = addTask.querySelector('input');
            const value = input.value.trim();

            if (!value) {
                return false;
            }

            task.querySelector('input').value = value;
            tasks.appendChild(task);

            input.value = '';

        });
        return taskList;
    }
};

window.addEventListener('load', () => document.body.appendChild(GOALS.createTaskList()));
