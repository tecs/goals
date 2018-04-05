GOALS.TaskList = class {
    /**
     * Constructs a task list based on the supplied configuration data, or creates a new one.
     * @param {DataStore} store
     * @param {HTMLElement} parentTask
     * @returns {HTMLElement}
     */
    static create(store, parentTask)
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

        // Notify the whole task tree so completion is updated
        window.postMessage('goals.completion', '*');

        const tasksStore = store.ns('tasks');

        const updateParent = () => {
            if (parentTask) {
                parentTask.update();
                return true;
            }
            return false;
        };

        const newTask = store => {
            const taskWrap = GOALS.template('task');
            const task = taskWrap.querySelector('div');
            let deleted = false;

            // Fill data
            const taskInput = task.querySelector('input[type=text]');
            taskInput.value = store.get('value');

            const completed = task.querySelector('input[type=checkbox]');
            completed.checked = !!store.get('completed');

            const span = task.querySelector('span');

            // Construct DOM
            const taskList = this.create(store, task);
            const taskListAddTask = taskList.querySelector('input[type=text]');
            taskListAddTask.placeholder = taskListAddTask.placeholder.replace('task', 'subtask');

            taskWrap.appendChild(taskList);
            tasks.appendChild(taskWrap);

            task.update = () => {
                store.set('updated', Date.now());
                if (!updateParent()) {
                    store.commit();
                }
            };

            // Calculate completion
            window.addEventListener('message', e => {
                if (!deleted && e.data === 'goals.completion') {
                    span.innerText = GOALS.calculateCompletion(store);
                }
            });

            // Delete task
            task.querySelector('button').addEventListener('click', () => {
                let message = 'Are you sure you want to delete this task';
                if (Object.keys(store.get('tasks')).length) {
                    message += ' and all of its subtasks';
                }
                if (!confirm(`${message}?`)) {
                    return;
                }
                tasksStore.unset(store.get('key'));
                tasksStore.commit();
                updateParent();
                tasks.removeChild(taskWrap);
                deleted = true;
                window.postMessage('goals.completion', '*');
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
                    task.update();
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
                task.update();
                store.commit();
                window.postMessage('goals.completion', '*');
            });
        };

        for (const key of tasksStore.keys()) {
            newTask(tasksStore.ns(key));
        }

        // Add task
        const addTaskFn = () => {
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
        };

        const manualAddTask = () => {
            addTaskFn();
            updateParent();
        };

        addTask.querySelector('button').addEventListener('click', manualAddTask);

        // Add task by pressing the ENTER key
        GOALS.onEnter(input, manualAddTask);

        return taskList;
    }
};
