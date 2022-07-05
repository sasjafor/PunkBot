import './setLogNoColor.js';
import * as logNoColor from '../../src/lib/log.js';

describe('lib', function () {
    describe('log', function () {
        const logString = 'test';

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('without color', function () {
            logNoColor.logger.debug(logString);
        });
    });
});