import { logger } from './../lib/log.js';

/*

limitedDict.js

A dict class that supports maximum size with LRU replacement policy

*/

class LimitedDict {
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
     * @param {any} item
     * @param {any} key
     */
    push(key, item) {
        if (this.dict[key]) {
            return;
        }

        if (this.size >= this.maxSize) {
            this.shift();
        }

        let newElem = new DictNode(key, item);
        newElem.next = null;
        if (this.head) {
            this.tail.next = newElem;
            newElem.prev = this.tail;
            this.tail = newElem;
        } else {
            this.head = newElem;
            this.tail = newElem;
        }
        this.size++;
        this.dict[key] = newElem;
    }

    shift() {
        let oldHead = this.head;
        if (this.size === 0) {
            return;
        } else if (this.size === 1) {
            this.head = null;
            this.tail = null;
        } else {
            this.head = oldHead.next;
            this.head.prev = null;
            oldHead.next = null;
        }
        this.size--;
        delete this.dict[oldHead.key];
        return oldHead;
    }

    /**
     * @param {any} elem
     */
    remove(elem) {
        if (!this.head) {
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
     * @param {any} key
     */
    get(key) {
        let elem = this.dict[key];
        if (!elem) {
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
            list += curr.value?.title + ', ';
            curr = curr.next;
        }
        list += ']';

        logger.debug(list);
    }
}

class DictNode {
    /**
     * @param {any} value
     */
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.next = null;
        this.prev = null;
    }
}

export {
    LimitedDict,
};
