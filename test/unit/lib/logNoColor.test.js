import './setLogNoColor.js';
import * as logNoColor from 'lib/log';

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