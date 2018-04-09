GOALS.Task = class extends GOALS.Emitter {
    /**
     * @param {DataStore} store
     * @param {HTMLElement} parent
     */
    constructor(store, parent)
    {
        super(parent);

        this.initialized = new Promise(r => this._initialize = r);

        // Prime an empty task
        if (!store.has('created')) {
            store.set('created', Date.now());
            store.set('updated', Date.now());
            store.set('completed', null);
            store.commit();
        }

        this.taskWrap = GOALS.template('task');
        this.taskWrap.id = GOALS.id();
        this.taskWrap.util = this;

        Object.assign(this, {
            store,
            taskList: GOALS.TaskList.create(store, this),
            task: this.taskWrap.querySelector('div.task'),
            taskInput: this.taskWrap.querySelector('input[type=text]'),
            completion: this.taskWrap.querySelector('span'),
            checkbox: this.taskWrap.querySelector('input[type=checkbox]'),
            overlay: this.taskWrap.querySelector('div.taskOverlay')
        });

        // Fill data
        this.taskInput.value = store.get('value');
        this.checkbox.checked = !!store.get('completed');

        // Construct DOM
        const taskListAddTask = this.taskList.element.querySelector('input[type=text]');
        taskListAddTask.placeholder = taskListAddTask.placeholder.replace('task', 'subtask');

        this.taskWrap.appendChild(this.taskList.element);

        // Delete task
        this.task.querySelector('button').addEventListener('click', () => this.delete());

        this.taskInput.addEventListener('change', () => this.edit());

        // Finish editing a task by pressing the ENTER key
        GOALS.onEnter(this.taskInput, () => {
            this.edit();
            this.taskInput.blur();
        });

        // Complete task
        this.checkbox.addEventListener('change', () => this.complete());

        // Collapse
        this.overlay.addEventListener('click', () => this.taskWrap.classList.toggle('open'));

        this._initialize();
    }

    /**
     * Constructs a task based on the supplied configuration data, or creates a new one.
     * @param {DataStore} store
     * @param {HTMLElement} parent
     * @returns {GOALS.Task}
     */
    static create(store, parent)
    {
        return new (GOALS.Task)(store, parent);
    }

    /** @returns {HTMLElement} */
    get element()
    {
        return this.taskWrap;
    }

    /** @returns {GOALS.Task[]} */
    get subtasks()
    {
        return this.taskList ? this.taskList.children : [];
    }

    /**
     * Recursively calculates the task's completion
     * @returns {Number}
     */
    calculateCompletion()
    {
        const tasks = this.subtasks;
        const out = {
            toString() {return tasks.length ? `${Math.round(this.v * 100)}%` : ''},
            v: this.store.get('completed') ? 1 : 0
        };

        if (tasks.length && !out.value) {
            out.v = tasks.reduce((total, task) => total + task.calculateCompletion().v, 0) / tasks.length;
        }

        return out;
    }

    /**
     * Edit task handler
     */
    edit()
    {
        const value = this.taskInput.value.trim();
        const oldValue = this.store.get('value');
        if (!value) {
            this.taskInput.value = oldValue;
            return false;
        }

        if (value !== oldValue) {
            this.store.set('value', value);
            this.emitOut('update');
        }
    }

    /**
     * Delete task handler
     */
    delete()
    {
        let message = 'Are you sure you want to delete this task';
        if (Object.keys(this.store.get('tasks')).length) {
            message += ' and all of its subtasks';
        }
        if (confirm(`${message}?`)) {
            const key = this.store.get('key');
            this.parent.removeTask(key);
        }
    }

    /**
     * Complete task handler
     */
    complete()
    {
        this.store.set('completed', this.checkbox.checked ? Date.now() : null);
        this.emitOut('update');
        this.emitOut('completion');
    }

    /**
     * Updates the completion text on `completion` events
     */
    async completionListener()
    {
        await this.initialized;
        this.completion.innerText = this.calculateCompletion();
    }

    /**
     * Bumps the `updated` timestamp on `update` events
     */
    async updateListener()
    {
        this.store.set('updated', Date.now());
        this.store.commit();
    }
};
