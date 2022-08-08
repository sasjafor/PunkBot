import { interaction, player, players } from '../discord-js.mocks.js';

import * as nowPlaying from '../../src/commands/nowPlaying.js';

import { buildProgressBar, prettifyTime } from '../../src/lib/util.js';
jest.mock('../../src/lib/util.js');

describe('commands', function () {
    describe('nowPlaying', function () {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('normal', async function() {
            await nowPlaying.execute(interaction, players);
            expect(player.getNowPlaying).toHaveBeenCalledTimes(1);
            expect(player.getProgress).toHaveBeenCalledTimes(1);
            expect(buildProgressBar).toHaveBeenCalledTimes(1);
            expect(prettifyTime).toHaveBeenCalledTimes(2);
        });

        it('nothing playing', async function() {
            player.getNowPlaying = jest.fn(() => { return null; });

            await nowPlaying.execute(interaction, players);
            expect(player.getNowPlaying).toHaveBeenCalledTimes(1);
            expect(player.getProgress).toHaveBeenCalledTimes(1);
            expect(buildProgressBar).toHaveBeenCalledTimes(0);
            expect(prettifyTime).toHaveBeenCalledTimes(0);
        });

        it('conn == null', async function() {
            player.conn = null;
            await nowPlaying.execute(interaction, players);
            expect(player.getNowPlaying).toHaveBeenCalledTimes(0);
            expect(player.getProgress).toHaveBeenCalledTimes(0);
        });
    });
});