import { logger } from './log.js';
class LimitedDict {
    dict;
    size;
    maxSize;
    head;
    tail;
    /**
     * @param {number} maxSize
     */
    constructor(maxSize) {
        this.dict = {};
        this.size = 0;
        this.maxSize = maxSize;
        this.head = null;
        this.tail = null;
    }
    // Returns the size of the dict.
    getSize() {
        return this.size;
    }
    // Returns whether the dict is empty
    isEmpty() {
        return this.size === 0;
    }
    /**
     * @param {TValue} item
     * @param {string} key
     */
    push(key, item) {
        if (this.dict[key] === null) {
            return;
        }
        if (this.size >= this.maxSize) {
            this.shift();
        }
        const newElem = new DictNode(key, item);
        newElem.next = null;
        if (this.head !== null) {
            if (this.tail !== null) {
                this.tail.next = newElem;
            }
            newElem.prev = this.tail;
            this.tail = newElem;
        }
        else {
            this.head = newElem;
            this.tail = newElem;
        }
        this.size++;
        this.dict[key] = newElem;
    }
    shift() {
        const oldHead = this.head;
        if (oldHead === null) {
            return null;
        }
        if (this.size === 0) {
            return null;
        }
        else if (this.size === 1) {
            this.head = null;
            this.tail = null;
        }
        else {
            this.head = oldHead.next;
            if (this.head !== null) {
                this.head.prev = null;
            }
            oldHead.next = null;
        }
        this.size--;
        delete this.dict[oldHead.key];
        return oldHead;
    }
    /**
     * @param {DictNode<TValue>} elem
     */
    remove(elem) {
        if (this.head === null) {
            return;
        }
        if (this.head === elem) {
            this.head = elem.next;
        }
        if (this.tail === elem) {
            this.tail = elem.prev;
        }
        if (elem.next) {
            elem.next.prev = elem.prev;
        }
        if (elem.prev) {
            elem.prev.next = elem.next;
        }
        this.size--;
        delete this.dict[elem.key];
        return;
    }
    /**
     * @param {string} key
     */
    get(key) {
        const elem = this.dict[key];
        if (elem === undefined) {
            return null;
        }
        if (elem !== this.tail) {
            this.remove(elem);
            this.push(key, elem.value);
        }
        return elem.value;
    }
    printlist() {
        let curr = this.head;
        let list = '[ Size: ' + this.size + ' | ';
        while (curr) {
            list += curr.value + ', ';
            curr = curr.next;
        }
        list += ']';
        logger.debug(list);
    }
}
class DictNode {
    next;
    prev;
    key;
    value;
    /**
     * @param {TValue} value
     */
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.next = null;
        this.prev = null;
    }
}
export { LimitedDict, };
//# sourceMappingURL=limitedDict.js.map