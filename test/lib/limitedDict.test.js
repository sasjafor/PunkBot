import { LimitedDict } from '../../src/lib/limitedDict.js';

global.console.log = jest.fn();

describe('lib', function () {
    describe('limitedDict', function () {
        var ldict = new LimitedDict(3);
        // const ldictEmptyOrig = new LimitedDict(3);
        // var ldictEmpty;

        const key1 = 'test1';
        const item1 = { value: '', next: null, prev: null };
        const key2 = 'test2';
        const item2 = { value: '', next: null, prev: null };
        const key3 = 'test3';
        const item3 = { value: '', next: null, prev: null };
        const key4 = 'test4';
        const item4 = { value: '', next: null, prev: null };
        // item1.next = item2;
        // item2.prev = item1;
        // item2.next = item3;
        // item3.prev = item2;

        // const dict = {
        //     key1: item1,
        //     key2: item2,
        //     key3: item3,
        // };
        // var ldictFull
        // const ldictFull = new LimitedDict(3);
        // ldictFull.dict = dict;
        // ldictFull.size = 3;
        // ldictFull.head = item1;
        // ldictFull.tail = item3;

        beforeEach(() => {
            jest.clearAllMocks();

            // Object.assign(ldictEmpty, ldictEmptyOrig);
            // Object.assign()
        });

        it('getSize', function() {
            let size = ldict.getSize();
            expect(size).toBe(0);
        });

        it('isEmpty true', function() {
            let isEmpty = ldict.isEmpty();
            expect(isEmpty).toBe(true);
        });

        it('get empty', function() {
            let el = ldict.get(key1);
            expect(el).toBe(null);
        });

        it('remove on empty', function() {
            let oldSize = ldict.size;
            ldict.remove(item2);
            expect(ldict.size).toBe(oldSize);
        });

        it('push on empty', function() {
            let oldSize = ldict.size;
            ldict.push(key1, item1);
            expect(ldict.size).toBe(oldSize + 1);
        });

        it('isEmpty false', function() {
            let isEmpty = ldict.isEmpty();
            expect(isEmpty).toBe(false);
        });

        it('get normal', function() {
            let el = ldict.get(key1);
            expect(el).toBe(item1);
        });

        it('push on one', function() {
            let oldSize = ldict.size;
            ldict.push(key2, item2);
            expect(ldict.size).toBe(oldSize + 1);
        });

        it('push same', function() {
            let oldSize = ldict.size;
            ldict.push(key2, item2);
            expect(ldict.size).toBe(oldSize);
        });

        it('push on two', function() {
            let oldSize = ldict.size;
            ldict.push(key3, item3);
            expect(ldict.size).toBe(oldSize + 1);
        });

        it('push on full', function() {
            let oldSize = ldict.size;
            ldict.push(key4, item4);
            expect(ldict.size).toBe(oldSize);
        });

        it('get reorder', function() {
            let el = ldict.get(key2);
            expect(el).toBe(item2);
        });

        it('printlist', function() {
            let oldSize = ldict.size;
            ldict.printlist();
            expect(ldict.size).toBe(oldSize);
        });

        it('remove first', function() {
            let oldSize = ldict.size;
            ldict.remove(ldict.dict[key3]);
            expect(ldict.size).toBe(oldSize - 1);
        });

        it('remove last', function() {
            let oldSize = ldict.size;
            ldict.remove(ldict.dict[key2]);
            expect(ldict.size).toBe(oldSize - 1);
        });

        it('shift last', function() {
            let oldSize = ldict.size;
            ldict.shift();
            expect(ldict.size).toBe(oldSize - 1);
        });

        it('shift empty', function() {
            let oldSize = ldict.size;
            ldict.shift();
            expect(ldict.size).toBe(oldSize);
        });
    });
});