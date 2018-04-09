GOALS.TaskList = class extends GOALS.Emitter {
    /**
     * @param {DataStore} store
     * @param {GOALS.Task} parent
     */
    constructor(store, parent)
    {
        super(parent);

        // Prime an empty tasklist
        if (!store.has('tasks')) {
            store.set('tasks', {});
            store.commit();
        }

        this.taskList = GOALS.template('taskList');
        this.taskList.id = GOALS.id();
        this.taskList.util = this;

        Object.assign(this, {
            store,
            tasksStore: store.ns('tasks'),
            tasksList: this.taskList.querySelector('.tasks')
        });

        const addTask = GOALS.template('addTask');
        this.input = addTask.querySelector('input[type=text]');

        this.taskList.insertBefore(addTask, this.tasksList);

        // Notify the whole task tree so completion is updated
        this.emitOutButSelf('completion');

        for (const key of this.tasksStore.keys()) {
            this.addTask(key);
        }

        const manualAddTask = () => {
            if (this.addTask()) {
                this.emitOut('update');
            }
        };

        addTask.querySelector('button').addEventListener('click', manualAddTask);

        // Add task by pressing the ENTER key
        GOALS.onEnter(this.input, manualAddTask);
    }

    /**
     * Constructs a task list based on the supplied configuration data, or creates a new one.
     * @param {DataStore} store
     * @param {GOALS.Task} parent
     * @returns {GOALS.TaskList}
     */
    static create(store, parent)
    {
        return new (GOALS.TaskList)(store, parent);
    }

    /** @returns {HTMLElement} */
    get element()
    {
        return this.taskList;
    }

    /** @returns {HTMLElement[]} */
    get taskElements()
    {
        return [...this.tasksList.children];
    }

    /** @returns {GOALS.Task[]} */
    get tasks()
    {
        return this.taskElements.map(task => task.util);
    }

    /**
     * Adds an existing or a new task to the tasklist
     * @param {String} key
     */
    addTask(key)
    {
        if (!key) {
            key = this.tasksStore.findFreeKey('');
            const value = this.input.value.trim();
            this.input.value = '';
            if (!value) {
                return false;
            }

            this.tasksStore.set(key, {key, value});
            this.tasksStore.commit();
        }
        const taskWrap = GOALS.Task.create(this.tasksStore.ns(key), this);
        this.tasksList.appendChild(taskWrap.element);
        return true;
    }

    /**
     * Removes a task from the tasklist
     * @param {string} key
     */
    removeTask(key)
    {
        const task = this.taskElements.filter(task => task.util.store.get('key') === key)[0];
        this.tasksStore.unset(key);
        this.tasksList.removeChild(task);
        task.util.detach();
        this.emitOut('update');
        this.emitOut('completion');
    }
};
