GOALS.TaskList = class {
    /**
     * @param {HTMLElement} taskList
     * @param {DataStore} store
     * @param {GOALS.Task} parentTaskWrap
     */
    constructor(taskList, store, parentTaskWrap)
    {
        // Prime an empty tasklist
        if (!store.has('tasks')) {
            store.set('tasks', {});
            store.commit();
        }

        Object.assign(this, {
            taskList,
            store,
            parentTaskWrap,
            tasksStore: store.ns('tasks'),
            tasksList: taskList.querySelector('.tasks')
        });

        const addTask = GOALS.template('addTask');
        const input = addTask.querySelector('input[type=text]');

        this.taskList.insertBefore(addTask, this.tasksList);

        // Notify the whole task tree so completion is updated
        window.postMessage('goals.completion', '*');

        for (const key of this.tasksStore.keys()) {
            this.addTask(key);
        }

        // Add task
        const addTaskFn = () => {
            const value = input.value.trim();
            input.value = '';
            if (!value) {
                return false;
            }

            this.addTask(null, value);
        };

        const manualAddTask = () => {
            addTaskFn();
            this.updateParent();
        };

        addTask.querySelector('button').addEventListener('click', manualAddTask);

        // Add task by pressing the ENTER key
        GOALS.onEnter(input, manualAddTask);
    }

    /**
     * Constructs a task list based on the supplied configuration data, or creates a new one.
     * @param {DataStore} store
     * @param {HTMLElement} parentTaskWrap
     * @returns {HTMLElement}
     */
    static create(store, parentTaskWrap)
    {
        const taskList = GOALS.template('taskList');
        taskList.util = new (GOALS.TaskList)(taskList, store, parentTaskWrap);
        return taskList;
    }

    /**
     * @returns {GOALS.Task[]}
     */
    get tasks()
    {
        return [...this.tasksList.children].map(task => task.util);
    }

    updateParent()
    {
        if (this.parentTaskWrap) {
            return this.parentTaskWrap.util.update();
        }
        this.store.commit();
    };

    /**
     * Adds an existing or a new task to the tasklist
     * @param {String} key
     * @param {String} value
     */
    addTask(key, value)
    {
        if (!key) {
            key = this.tasksStore.findFreeKey('');
            this.tasksStore.set(key, {key, value});
            this.tasksStore.commit();
        }
        const taskWrap = GOALS.Task.create(this.tasksStore.ns(key), this.taskList);
        this.tasksList.appendChild(taskWrap);
    }

    /**
     * Removes a task from the tasklist
     * @param {string} key
     */
    removeTask(key)
    {
        const task = [...this.tasksList.children].filter(task => task.util.store.get('key') === key)[0];
        this.tasksStore.unset(key);
        this.tasksList.removeChild(task);
        this.updateParent();
        window.postMessage('goals.completion', '*');
    }
};
