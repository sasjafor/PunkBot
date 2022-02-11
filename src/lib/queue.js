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
class Queue {
    constructor() {
        // initialise the queue and offset
        this.queue = [];
        this.offset = 0;
    }

    // Returns the length of the queue.
    getLength() {
        return (this.queue.length - this.offset);
    }

    // Returns true if the queue is empty, and false otherwise.
    isEmpty() {
        return (this.queue.length == 0);
    }

    /* Enqueues the specified item. The parameter is:
     *
     * item - the item to enqueue
     */
    /**
     * @param {any} item
     */
    enqueue(item) {
        this.queue.push(item);
    }

    /* Dequeues an item and returns it. If the queue is empty, the value
     * 'undefined' is returned.
     */
    dequeue() {
        // if the queue is empty, return immediately
        if (this.queue.length == 0) {
            return undefined;
        }

        // store the item at the front of the queue
        var item = this.queue[this.offset];

        // increment the offset and remove the free space if necessary
        if (++this.offset * 2 >= this.queue.length) {
            this.queue = this.queue.slice(this.offset);
            this.offset = 0;
        }

        // return the dequeued item
        return item;
    }

    /* Returns the item at the front of the queue (without dequeuing it). If the
     * queue is empty then undefined is returned.
     */
    peek() {
        return (this.queue.length > 0 ? this.queue[this.offset] : undefined);
    }

    /* Removes the item location at index from the queue.
     * Not part of original code
     *
     * index - index of the item to be removed
     */
    /**
     * @param {number} index
     */
    remove(index) {
        return this.queue.splice(index + this.offset, 1);
    }

    /**
     * @param {number} index
     */
    get(index) {
        return this.queue[index + this.offset];
    }

    /* Shuffles the queue
     */
    shuffle() {
        var queue = this.queue;
        var l = queue.length + 1;
        while (l-- > this.offset) {
            var r = ~~(Math.random() * (l - this.offset)) + this.offset, o = queue[r];

            queue[r] = queue[this.offset];
            queue[this.offset] = o;
        }
    }
}

module.exports = {
    Queue,
};
