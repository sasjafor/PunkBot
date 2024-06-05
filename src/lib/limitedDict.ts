import { logger } from './log.js';

/*

limitedDict.js

A dict class that supports maximum size with LRU replacement policy

*/

interface GenericDict<TValue> {
    [key: string]: DictNode<TValue>;
}

class LimitedDict<TValue> {
    private dict: GenericDict<TValue>;
    private size: number;
    private maxSize: number;
    private head: DictNode<TValue> | null;
    private tail: DictNode<TValue> | null;

    /**
     * @param {number} maxSize
     */
    public constructor(maxSize: number) {
        this.dict = {};
        this.size = 0;
        this.maxSize = maxSize;
        this.head = null;
        this.tail = null;
    }

    // Returns the size of the dict.
    public getSize(): number {
        return this.size;
    }

    // Returns whether the dict is empty
    public isEmpty(): boolean {
        return this.size === 0;
    }

    /**
     * @param {TValue} item
     * @param {string} key
     */
    public push(key: string, item: TValue): void {
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
        } else {
            this.head = newElem;
            this.tail = newElem;
        }
        if (!(key in this.dict)) {
            this.size++;
        }
        this.dict[key] = newElem;
    }

    private shift(): DictNode<TValue> | null {
        const oldHead = this.head;

        if (oldHead === null) {
            return null;
        }
        if (this.size === 0) {
            return null;
        } else if (this.size === 1) {
            this.head = null;
            this.tail = null;
        } else {
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
    private remove(elem: DictNode<TValue>): void {
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
    public get(key: string): TValue | null {
        const elem: DictNode<TValue> = this.dict[key];
        if (elem === undefined) {
            return null;
        }
        if (elem !== this.tail) {
            this.remove(elem);
            this.push(key, elem.value);
        }

        return elem.value;
    }

    public printlist(): void {
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

class DictNode<TValue> {
    public next: DictNode<TValue> | null;
    public prev: DictNode<TValue> | null;
    public key: string;
    public value: TValue;

    /**
     * @param {TValue} value
     */
    constructor(key: string, value: TValue) {
        this.key = key;
        this.value = value;
        this.next = null;
        this.prev = null;
    }
}

export {
    LimitedDict,
};
