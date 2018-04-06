GOALS.Task = class {
    constructor(taskWrap, store, parentTaskList)
    {
        Object.assign(this, {taskWrap, store, parentTaskList});

        const task = taskWrap.querySelector('div');
        let deleted = false;

        // Fill data
        const taskInput = task.querySelector('input[type=text]');
        taskInput.value = store.get('value');

        const completed = task.querySelector('input[type=checkbox]');
        completed.checked = !!store.get('completed');

        const span = task.querySelector('span');

        // Construct DOM
        const taskList = GOALS.TaskList.create(store, task);
        const taskListAddTask = taskList.querySelector('input[type=text]');
        taskListAddTask.placeholder = taskListAddTask.placeholder.replace('task', 'subtask');

        taskWrap.appendChild(taskList);

        task.update = () => {
            store.set('updated', Date.now());
            this.updateParent();
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
            const key = store.get('key');
            parentTaskList.util.removeTask(key);
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
    }

    static create(store, parentTaskList)
    {
        const taskWrap = GOALS.template('task');
        taskWrap.util = new (GOALS.Task)(taskWrap, store, parentTaskList);
        return taskWrap;
    }

    updateParent()
    {
        this.parentTaskList.util.updateParent();
    }
};
