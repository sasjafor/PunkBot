import * as queue from '../../src/lib/queue.js';

global.console.log = jest.fn();

describe('lib', function () {
    describe('limitedDict', function () {
        var queueObj = new queue.Queue();

        const index1 = 0;
        const item1 = {};

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('getLength', function() {
            let size = queueObj.getLength();
            expect(size).toBe(0);
        });

        it('isEmpty true', function() {
            let isEmpty = queueObj.isEmpty();
            expect(isEmpty).toBe(true);
        });

        it('dequeue empty', function() {
            let el = queueObj.dequeue();
            expect(el).toBeFalsy();
        });

        it('peek empty', function() {
            let el = queueObj.peek();
            expect(el).toBeFalsy();
        });

        it('remove on empty', function() {
            let oldSize = queueObj.queue.length;
            queueObj.remove(index1);
            expect(queueObj.queue.length).toBe(oldSize);
        });

        it('enqueue on empty', function() {
            let oldSize = queueObj.queue.length;
            queueObj.enqueue(item1);
            expect(queueObj.queue.length).toBe(oldSize + 1);
        });

        it('isEmpty false', function() {
            let isEmpty = queueObj.isEmpty();
            expect(isEmpty).toBe(false);
        });

        it('get normal', function() {
            let el = queueObj.get(index1);
            expect(el).toBe(item1);
        });

        it('peek normal', function() {
            let el = queueObj.peek();
            expect(el).toBe(item1);
        });

        it('shuffle normal', function() {
            let oldSize = queueObj.queue.length;
            queueObj.shuffle();
            expect(queueObj.queue.length).toBe(oldSize);
        });
    });
});