import * as limitedDict from 'lib/limitedDict';

global.console.log = jest.fn();

describe('lib', function () {
    describe('limitedDict', function () {
        var ldict = new limitedDict.LimitedDict(3);

        const key1 = 'test1';
        const item1 = { value: '', next: null, prev: null };
        const key2 = 'test2';
        const item2 = { value: '', next: null, prev: null };
        const key3 = 'test3';
        const item3 = { value: '', next: null, prev: null };
        const key4 = 'test4';
        const item4 = { value: '', next: null, prev: null };

        beforeEach(() => {
            jest.clearAllMocks();
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
            expect(el).toBeFalsy();
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