import * as logColor from '../../src/lib/log.js';

describe('lib', function () {
    describe('log', function () {
        const logString = 'test';

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('with color', function () {
            logColor.logger.debug(logString);
        });

        it('with stack info', function () {
            logColor.logger.debug(new Error(logString));
        });
    });
});
