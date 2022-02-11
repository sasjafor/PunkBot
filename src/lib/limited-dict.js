/*

limited-dcit.js

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
        return this.size == 0;
    }

    /**
     * @param {any} item
     * @param {any} key
     */
    push(key, item) {
        if (this.size >= this.maxSize) {
            this.shift();
        }

        let newElem = new DictNode(item);
        newElem.next = null;
        if (this.head != null) {
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
        if (this.size == 0) {
            return;
        } else if (this.size == 1) {
            this.head == null;
            this.tail == null;
        } else {
            this.head = oldHead.next;
            this.head.prev = null;
            oldHead.next = null;
        }
        this.size--;
        return oldHead;
    }

    /**
     * @param {any} elem
     */
    remove(elem) {
        if (this.head == null) {
            return;
        }

        if (this.head == elem) {
            this.head = elem.next;
        }
        if (this.tail == elem) {
            this.tail = elem.prev;
        }
        if (elem.next != null) {
            elem.next.prev = elem.prev;
        }
        if (elem.prev != null) {
            elem.prev.next = elem.next;
        }
        this.size--;
        return;
    }

    /**
     * @param {any} key
     */
    get(key) {
        let elem = this.dict[key];
        if (elem == null) {
            return null;
        }
        if (elem != this.tail) {
            this.remove(elem);
            this.push(key, elem.value);
        }

        return elem.value;
    }

    printlist() {
        let curr = this.head;

        // console.log(this.dict);
        let list = '[ Size: ' + this.size + ' | ';
        while (curr != null) {
            // console.log(curr);
            list += curr.value?.title + ', ';
            curr = curr.next;
        }
        list += ']';

        console.log(list);
   }
}

class DictNode {
    /**
     * @param {any} value
     */
    constructor(value) {
        this.value = value;
        this.next = null;
        this.prev = null;
    }
}

module.exports = {
    LimitedDict,
};
