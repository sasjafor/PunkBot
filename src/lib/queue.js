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
function Queue() {

    // initialise the queue and offset
    this.queue = [];
    var offset = 0;

    // Returns the length of the queue.
    this.getLength = function() {
        return (this.queue.length - offset);
    };

    // Returns true if the queue is empty, and false otherwise.
    this.isEmpty = function() {
        return (this.queue.length == 0);
    };

    /* Enqueues the specified item. The parameter is:
     *
     * item - the item to enqueue
     */
    this.enqueue = function(item) {
        this.queue.push(item);
    };

    /* Dequeues an item and returns it. If the queue is empty, the value
     * 'undefined' is returned.
     */
    this.dequeue = function() {

        // if the queue is empty, return immediately
        if (this.queue.length == 0) return undefined;

        // store the item at the front of the queue
        var item = this.queue[offset];

        // increment the offset and remove the free space if necessary
        if (++offset * 2 >= this.queue.length) {
            this.queue = this.queue.slice(offset);
            offset = 0;
        }

        // return the dequeued item
        return item;
    };

    /* Returns the item at the front of the queue (without dequeuing it). If the
     * queue is empty then undefined is returned.
     */
    this.peek = function() {
        return (this.queue.length > 0 ? this.queue[offset] : undefined);
    };

    /* Removes the item location at index from the queue.
     * Not part of original code
     *
     * index - index of the item to be removed
     */
    this.remove = function(index) {
        return this.queue.splice(index + offset, 1);
    };

    /* Shuffles the queue
     */
    this.shuffle = function() {
        var queue = this.queue;
        var l = queue.length + 1;
        while (l-- > offset) {
            var r = ~~(Math.random() * (l - offset)) + offset,
                o = queue[r];

            queue[r] = queue[offset];
            queue[offset] = o;
        }
    };
}

module.exports.Queue = Queue;
