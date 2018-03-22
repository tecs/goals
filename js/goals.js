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

    /**
     * Constructs a task list based on the supplied configuration data, or creates a new one.
     * @returns {HTMLElement}
     */
    createTaskList()
    {
        const taskList = GOALS.template('taskList');
        const addTask = GOALS.template('addTask');
        const tasks = taskList.querySelector('.tasks');
        const input = addTask.querySelector('input');

        taskList.insertBefore(addTask, tasks);

        const newTask = value => {
            const task = GOALS.template('task');

            task.querySelector('input').value = value;
            tasks.appendChild(task);
            tasks.appendChild(GOALS.createTaskList());
        };

        addTask.querySelector('button').addEventListener('click', () => {
            const value = input.value.trim();
            input.value = '';
            if (!value) {
                return false;
            }

            task.querySelector('input').value = value;
            tasks.appendChild(task);

            input.value = '';

            newTask(value);
        });

        return taskList;
    }
};

window.addEventListener('load', () => document.body.appendChild(GOALS.createTaskList()));
