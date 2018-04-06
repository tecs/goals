GOALS.TaskList = class {
    /**
     * @param {HTMLElement} taskList
     * @param {DataStore} store
     * @param {GOALS.Task} parentTask
     */
    constructor(taskList, store, parentTask)
    {
        // Prime an empty tasklist
        if (!store.has('tasks')) {
            store.set('tasks', {});
            store.commit();
        }

        Object.assign(this, {
            taskList,
            store,
            parentTask,
            tasksStore: store.ns('tasks'),
            tasks: taskList.querySelector('.tasks')
        });

        const addTask = GOALS.template('addTask');
        const input = addTask.querySelector('input[type=text]');

        this.taskList.insertBefore(addTask, this.tasks);

        // Notify the whole task tree so completion is updated
        window.postMessage('goals.completion', '*');

        for (const key of this.tasksStore.keys()) {
            this.addTask(this.tasksStore.ns(key));
        }

        // Add task
        const addTaskFn = () => {
            const value = input.value.trim();
            input.value = '';
            if (!value) {
                return false;
            }

            const key = this.tasksStore.findFreeKey('');
            this.tasksStore.set(key, {
                key,
                value,
                created: Date.now(),
                updated: Date.now(),
                completed: null
            });
            this.tasksStore.commit();

            this.addTask(this.tasksStore.ns(key));
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
     * @param {HTMLElement} parentTask
     * @returns {HTMLElement}
     */
    static create(store, parentTask)
    {
        const taskList = GOALS.template('taskList');
        taskList.util = new (GOALS.TaskList)(taskList, store, parentTask);
        return taskList;
    }

    updateParent()
    {
        if (this.parentTask) {
            return this.parentTask.update();
        }
        this.store.commit();
    };

    addTask(store)
    {
        const taskWrap = GOALS.Task.create(store, this.taskList);
        this.tasks.appendChild(taskWrap);
    }

    removeTask(key)
    {
        const task = [...this.tasks.children].filter(task => task.util.store.get('key') === key)[0];
        this.tasksStore.unset(key);
        this.tasks.removeChild(task);
        this.updateParent();
        window.postMessage('goals.completion', '*');
    }
};
