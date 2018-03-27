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
        const input = addTask.querySelector('input[type=text]');

        taskList.insertBefore(addTask, tasks);

        // Prime an empty tasklist
        if (!store.has('tasks')) {
            store.set('tasks', {});
            store.commit();
        }

        const tasksStore = store.ns('tasks');

        const newTask = store => {
            const taskWrap = GOALS.template('task');
            const task = taskWrap.querySelector('div');

            // Fill data
            const taskInput = task.querySelector('input[type=text]');
            taskInput.value = store.get('value');

            const completed = task.querySelector('input[type=checkbox]');
            completed.checked = !!store.get('completed');

            // Construct DOM
            const taskList = GOALS.createTaskList(store);
            const taskListAddTask = taskList.querySelector('input[type=text]');
            taskListAddTask.placeholder = taskListAddTask.placeholder.replace('task', 'subtask');

            taskWrap.appendChild(taskList);
            tasks.appendChild(taskWrap);

            // Delete task
            task.querySelector('button').addEventListener('click', () => {
                tasksStore.unset(store.get('key'));
                tasksStore.commit();
                tasks.removeChild(taskWrap);
            });

            // Edit task
            taskInput.addEventListener('change', () => {
                const value = taskInput.value.trim();
                const oldValue = store.get('value');
                if (!value) {
                    taskInput.value = oldValue;
                    return false;
                }

                if (value !== oldValue) {
                    store.set('value', value);
                    store.set('updated', Date.now());
                    store.commit();
                }
            });

            // Complete task
            completed.addEventListener('change', () => {
                const now = Date.now();
                store.set('completed', completed.checked ? now : null);
                store.set('updated', now);
                store.commit();
            });
        };

        for (const key of tasksStore.keys()) {
            newTask(tasksStore.ns(key));
        }

        // Add task
        addTask.querySelector('button').addEventListener('click', () => {
            const value = input.value.trim();
            input.value = '';
            if (!value) {
                return false;
            }

            const key = tasksStore.findFreeKey('');
            tasksStore.set(key, {
                key,
                value,
                created: Date.now(),
                updated: Date.now(),
                completed: null
            });
            tasksStore.commit();

            newTask(tasksStore.ns(key));
        });

        return taskList;
    }
};

window.addEventListener('load', () => {
    document.body.appendChild(GOALS.createTaskList(GOALS.store));
});
