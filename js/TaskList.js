GOALS.TaskList = class {
    /**
     * @param {DataStore} store
     * @param {GOALS.Task} parentTask
     */
    constructor(store, parentTask)
    {
        // Prime an empty tasklist
        if (!store.has('tasks')) {
            store.set('tasks', {});
            store.commit();
        }

        this.taskList = GOALS.template('taskList');
        this.taskList.util = this;

        Object.assign(this, {
            store,
            parentTask,
            tasksStore: store.ns('tasks'),
            tasksList: this.taskList.querySelector('.tasks')
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
     * @param {GOALS.Task} parentTask
     * @returns {GOALS.TaskList}
     */
    static create(store, parentTask)
    {
        return new (GOALS.TaskList)(store, parentTask);
    }

    /** @returns {HTMLElement} */
    get element()
    {
        return this.taskList;
    }

    /** @returns {GOALS.Task[]} */
    get tasks()
    {
        return [...this.tasksList.children].map(task => task.util);
    }

    updateParent()
    {
        if (this.parentTask) {
            return this.parentTask.update();
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
        const taskWrap = GOALS.Task.create(this.tasksStore.ns(key), this);
        this.tasksList.appendChild(taskWrap.element);
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
