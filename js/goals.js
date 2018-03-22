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
     * Constructs a task list based on the supplied configuration data, or creates a new one.
     * @param {DataStore} store
     * @returns {HTMLElement}
     */
    createTaskList(store)
    {
        const taskList = GOALS.template('taskList');
        const addTask = GOALS.template('addTask');
        const tasks = taskList.querySelector('.tasks');
        const input = addTask.querySelector('input');

        taskList.insertBefore(addTask, tasks);

        if (!store.has('tasks')) {
            store.set('tasks', {});
            store.commit();
        }

        const tasksStore = store.ns('tasks');

        const newTask = store => {
            const task = GOALS.template('task');

            task.querySelector('input').value = store.get('value');
            task.appendChild(GOALS.createTaskList(store));
            tasks.appendChild(task);

            task.querySelector('button').addEventListener('click', () => {
                tasksStore.unset(store.get('key'));
                tasksStore.commit();
                tasks.removeChild(task);
            });
        };

        for (const key of tasksStore.keys()) {
            newTask(tasksStore.ns(key));
        }

        addTask.querySelector('button').addEventListener('click', () => {
            const value = input.value.trim();
            input.value = '';
            if (!value) {
                return false;
            }

            const key = tasksStore.findFreeKey('');
            tasksStore.set(key, {key, value});
            tasksStore.commit();

            newTask(tasksStore.ns(key));
        });

        return taskList;
    }
};

window.addEventListener('load', () => {
    document.body.appendChild(GOALS.createTaskList(GOALS.store));
});
