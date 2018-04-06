GOALS.Task = class {
    /**
     * @param {DataStore} store
     * @param {HTMLElement} parentTaskList
     */
    constructor(store, parentTaskList)
    {
        // Prime an empty task
        if (!store.has('created')) {
            store.set('created', Date.now());
            store.set('updated', Date.now());
            store.set('completed', null);
            store.commit();
        }

        this.taskWrap = GOALS.template('task');
        this.taskWrap.util = this;

        Object.assign(this, {
            store,
            parentTaskList,
            taskList: GOALS.TaskList.create(store, this),
            task: this.taskWrap.querySelector('div'),
            completion: this.taskWrap.querySelector('span')
        });

        let deleted = false;

        // Fill data
        const taskInput = this.task.querySelector('input[type=text]');
        taskInput.value = store.get('value');

        const completed = this.task.querySelector('input[type=checkbox]');
        completed.checked = !!store.get('completed');

        // Construct DOM
        const taskListAddTask = this.taskList.element.querySelector('input[type=text]');
        taskListAddTask.placeholder = taskListAddTask.placeholder.replace('task', 'subtask');

        this.taskWrap.appendChild(this.taskList.element);

        // Calculate completion
        window.addEventListener('message', e => {
            if (!deleted && e.data === 'goals.completion') {
                this.completion.innerText = this.calculateCompletion();
            }
        });

        // Delete task
        this.task.querySelector('button').addEventListener('click', () => {
            let message = 'Are you sure you want to delete this task';
            if (Object.keys(store.get('tasks')).length) {
                message += ' and all of its subtasks';
            }
            if (!confirm(`${message}?`)) {
                return;
            }
            const key = store.get('key');
            parentTaskList.removeTask(key);
            deleted = true;
        });

        // Edit task
        const editTaskFn = () => {
            const value = taskInput.value.trim();
            const oldValue = store.get('value');
            if (!value) {
                taskInput.value = oldValue;
                return false;
            }

            if (value !== oldValue) {
                store.set('value', value);
                this.update();
                store.commit();
            }
        };

        taskInput.addEventListener('change', editTaskFn);

        // Finish editing a task by pressing the ENTER key
        GOALS.onEnter(taskInput, () => {
            editTaskFn();
            taskInput.blur();
        });

        // Complete task
        completed.addEventListener('change', () => {
            store.set('completed', completed.checked ? Date.now() : null);
            this.update();
            store.commit();
            window.postMessage('goals.completion', '*');
        });
    }

    /**
     * Constructs a task based on the supplied configuration data, or creates a new one.
     * @param {DataStore} store
     * @param {HTMLElement} parentTaskList
     * @returns {GOALS.Task}
     */
    static create(store, parentTaskList)
    {
        return new (GOALS.Task)(store, parentTaskList);
    }

    /** @returns {HTMLElement} */
    get element()
    {
        return this.taskWrap;
    }

    /** @returns {GOALS.Task[]} */
    get subtasks()
    {
        return this.taskList.tasks;
    }

    update()
    {
        this.store.set('updated', Date.now());
        this.updateParent();
    };

    updateParent()
    {
        this.parentTaskList.updateParent();
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
};
