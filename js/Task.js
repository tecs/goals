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
            store.set('completed', null);
            store.set('open', false);
            this.emitOut('update');
        }

        this.taskWrap = GOALS.template('task');
        this.taskWrap.id = GOALS.id();
        this.taskWrap.util = this;

        Object.assign(this, {
            store,
            task: this.taskWrap.querySelector('div.task'),
            taskInput: this.taskWrap.querySelector('input[type=text]'),
            completion: this.taskWrap.querySelector('span'),
            checkbox: this.taskWrap.querySelector('input[type=checkbox]'),
            overlay: this.taskWrap.querySelector('div.taskOverlay')
        });

        this.taskList = GOALS.TaskList.create(store, this);


        // Fill data
        this.taskInput.value = store.get('value');
        this.checkbox.checked = !!store.get('completed');

        this.store.set('open', this.isOpen);
        this.store.commit();
        if (this.store.get('open')) {
            this.taskWrap.classList.toggle('open');
        }

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
        this.overlay.addEventListener('click', () => this.collapse());

        // Drag and drop
        this.taskWrap.addEventListener('dragstart', e => this.dragStart(e));
        this.taskWrap.addEventListener('dragover', e => this.dragOver(e));
        this.taskWrap.addEventListener('dragleave', e => this.dragLeave(e));
        this.taskWrap.addEventListener('drop', e => this.drop(e));

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

    /** @returns {GOALS.Task} */
    get parentTask()
    {
        return this.parent.parent;
    }

    /** @returns {Boolean} */
    get isOpen()
    {
        return this.store.get('open') && (this.parentTask ? this.parentTask.isOpen : true);
    }

    /**
     * Toggles the task state between collapsed and expanded
     */
    collapse()
    {
        this.taskWrap.classList.toggle('open');
        this.store.set('open', this.taskWrap.classList.contains('open'));
        this.store.commit();
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
     * Drag task handler
     * @param {DragEvent} e
     */
    dragStart(e)
    {
        e.stopPropagation();

        e.dataTransfer.setData(this.taskWrap.id, this.taskWrap.id);
        e.dataTransfer.setData('text/plain', this.taskWrap.id);
    }

    /**
     * Drag task over handler
     * @param {DragEvent} e
     */
    dragOver(e)
    {
        e.preventDefault();
        e.stopPropagation();

        e.dataTransfer.dropEffect = 'none';

        const from = GOALS.ui(e.dataTransfer.types.filter(t => t !== 'text/plain'));

        const state = this.getDragState(this.taskWrap, from, e);

        if (!state.canDrop) {
            return false;
        }

        e.dataTransfer.dropEffect = 'move';

        const classNames = ['dropBefore', 'dropAfter'];
        const add = state.after ? 1 : 0;
        const remove = 1 - add;
        if (!this.element.classList.contains(classNames[add])) {
            this.element.classList.add(classNames[add]);
        }
        this.element.classList.remove(classNames[remove]);
    }

    /**
     * Drag task leave handler
     * @param {DragEvent} e
     */
    dragLeave(e)
    {
        e.preventDefault();
        e.stopPropagation();

        this.element.classList.remove('dropBefore');
        this.element.classList.remove('dropAfter');
    }

    /**
     * Drop task handler
     * @param {DragEvent} e
     */
    drop(e)
    {
        e.stopPropagation();
        e.preventDefault();

        const from = GOALS.ui(e.dataTransfer.getData('text/plain'));

        const state = this.getDragState(this.taskWrap, from, e);

        if (!state.canDrop) {
            return false;
        }

        if (state.before) {
            return this.taskWrap.parentElement.insertBefore(from, this.taskWrap);
        }
        this.taskWrap.parentElement.insertBefore(from, this.taskWrap.nextSibling);
    }

    /**
     * Calculates the drag relation between the two elements
     * @param {HTMLElement} dropElement
     * @param {HTMLElement} dragElement
     * @param {DragEvent} e
     * @returns {Object}
     */
    getDragState(dropElement, dragElement, e)
    {
        const children = this.parent.taskElements;
        const dropIndex = children.indexOf(dropElement);
        const dragIndex = children.indexOf(dragElement);
        const heightThreshold = dropElement.clientHeight / 2;

        const out = {
            canDrop: dropElement !== dragElement && dragIndex !== -1,
            after: e.offsetY >= heightThreshold,
            before: e.offsetY < heightThreshold
        };

        if ((dragIndex - 1 === dropIndex && out.after) || (dragIndex + 1 === dropIndex && out.before)) {
            out.canDrop = false;
        }

        return out;
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
