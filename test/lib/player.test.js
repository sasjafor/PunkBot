import * as player from '../../src/lib/player.js';

import got from 'got';
jest.mock('got');

global.console.log = jest.fn();

describe('lib', function () {
    describe('player', function () {
        var playerObj = new player.Player();


        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('getQueue', function() {
            let queue = playerObj.getQueue();
            expect(queue).toBe(playerObj.queue);
        }); 
    });
});