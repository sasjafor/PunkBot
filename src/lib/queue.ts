/*

Queue.js

A function to represent a queue

Created by Kate Morley - http://code.iamkate.com/ - and released under the terms
of the CC0 1.0 Universal legal code:

http://creativecommons.org/publicdomain/zero/1.0/legalcode

*/
/* Modified to accomodate node.js module importing */
/* Creates a new queue. A queue is a first-in-first-out (FIFO) data structure -
 * items are added to the end of the queue and removed from the front.
 */
class Queue<T> implements Iterable<T> {
    private queue: T[];
    private offset: number;

    public constructor() {
        // initialise the queue and offset
        this.queue = [];
        this.offset = 0;
    }

    [Symbol.iterator](): QueueIterator<T> {
        return new QueueIterator(this.queue, this.offset);
    }

    // Returns the length of the queue.
    public getLength(): number {
        return (this.queue.length - this.offset);
    }

    // Returns true if the queue is empty, and false otherwise.
    public isEmpty(): boolean {
        return (this.queue.length === 0);
    }

    /* Enqueues the specified item. The parameter is:
     *
     * item - the item to enqueue
     */
    /**
     * @param {T} item
     */
    public enqueue(item: T): number {
        return this.queue.push(item);
    }

    /* Dequeues an item and returns it. If the queue is empty, the value
     * 'null' is returned.
     */
    public dequeue(): T | null {
        // if the queue is empty, return immediately
        if (this.queue.length === 0) {
            return null;
        }

        // get the item at the front of the queue
        const item = this.queue[this.offset];

        // increment the offset and remove the free space if necessary
        if (++this.offset * 2 >= this.queue.length) {
            this.queue = this.queue.slice(this.offset);
            this.offset = 0;
        }

        // return the dequeued item
        return item;
    }

    public addFirst(item: T): void {
        if (this.offset === 0) {
            this.queue.unshift(item);
        } else {
            this.queue[this.offset - 1] = item;
        }
    }

    /* Returns the item at the front of the queue (without dequeuing it). If the
     * queue is empty then null is returned.
     */
    public peek(): T | null {
        return (this.queue.length > 0 ? this.queue[this.offset] : null);
    }

    /* Removes the item location at index from the queue.
     * Not part of original code
     *
     * index - index of the item to be removed
     */
    /**
     * @param {number} index
     */
    public remove(index: number): T | null {
        const removed: T[] = this.queue.splice(index + this.offset, 1);
        if (removed.length === 1) {
            return removed[0];
        } else {
            return null;
        }
    }

    /**
     * @param {number} index
     */
    public get(index: number): T {
        return this.queue[index + this.offset];
    }

    /* Shuffles the queue
     */
    public shuffle(): void {
        const queue = this.queue;
        let l = queue.length + 1;
        while (l-- > this.offset) {
            const r = ~~(Math.random() * (l - this.offset)) + this.offset;
            const o = queue[r];

            queue[r] = queue[this.offset];
            queue[this.offset] = o;
        }
    }
}

class QueueIterator<T> implements Iterator<T> {
    private index: number;
    private done: boolean;
    private values: T[];

    constructor(values: T[], offset: number) {
        this.index = offset;
        this.done = false;
        this.values = values;
    }

    next(): IteratorResult<T, number | undefined> {
        if (this.done) {
            return {
                done: true,
                value: undefined,
            };
        }
        if (this.index === this.values.length) {
            this.done = true;
            return {
                done: true,
                value: this.index,
            };
        }
        const value = this.values[this.index];
        this.index += 1;
        return {
            done: false,
            value,
        };
    }
}

export {
    Queue,
};
