GOALS.Emitter = class {
    /**
     * @param {GOALS.Emitter} parent
     */
    constructor(parent)
    {
        this.children = [];
        this.parent = parent;
        if (this.parent) {
            this.parent.children.push(this);
        }
    }

    /**
     * Disassociates this emitter from its parent
     */
    detach()
    {
        if (this.parent) {
            const index = this.parent.children.indexOf(this);
            this.parent.children.splice(index, 1);
        }
    }

    /**
     * Emits a new message
     * @param {String} name
     * @param {*} data
     * @param {string} direction
     * @param {Boolean} self
     */
    async emit(name, data, direction = GOALS.Emitter.Direction.OUT, self = true, sender = this)
    {
        const methodName = `${name}Listener`;
        if (self && methodName in this) {
            this[methodName](data, sender);
        }

        if (this.parent && direction !== GOALS.Emitter.Direction.IN) {
            this.parent.emit(name, data, GOALS.Emitter.Direction.OUT, true, sender);
        }

        if (direction !== GOALS.Emitter.Direction.OUT) {
            this.children.forEach(child => child.emit(name, data, GOALS.Emitter.Direction.IN, true, sender));
        }
    }

    /**
     * Emits a new message to all listeners including self
     * @param {String} name
     * @param {*} data
     */
    async emitAll(name, data)
    {
        this.emit(name, data, GOALS.Emitter.Direction.ALL, true);
    }

    /**
     * Emits a new message to all listeners but self
     * @param {String} name
     * @param {*} data
     */
    async emitAllButSelf(name, data)
    {
        this.emit(name, data, GOALS.Emitter.Direction.ALL, false);
    }

    /**
     * Emits a new message to parent listeners including self
     * @param {String} name
     * @param {*} data
     */
    async emitOut(name, data)
    {
        this.emit(name, data, GOALS.Emitter.Direction.OUT, true);
    }

    /**
     * Emits a new message to parent listeners including self
     * @param {String} name
     * @param {*} data
     */
    async emitOutButSelf(name, data)
    {
        this.emit(name, data, GOALS.Emitter.Direction.OUT, false);
    }

    /**
     * Emits a new message to child listeners including self
     * @param {String} name
     * @param {*} data
     */
    async emitIn(name, data)
    {
        this.emit(name, data, GOALS.Emitter.Direction.IN, true);
    }

    /**
     * Emits a new message to child listeners including self
     * @param {String} name
     * @param {*} data
     */
    async emitInButSelf(name, data)
    {
        this.emit(name, data, GOALS.Emitter.Direction.IN, false);
    }
};

GOALS.Emitter.Direction = {
    ALL: 1,
    IN: 2,
    OUT: 3
};
