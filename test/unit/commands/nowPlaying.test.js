import { interaction, player, players, resetMockObjects } from 'discord-js.mocks';

import * as nowPlaying from 'commands/nowPlaying';

import { buildProgressBar, prettifyTime } from 'lib/util';
jest.mock('lib/util');

describe('commands', function () {
    describe('nowPlaying', function () {
        beforeEach(() => {
            jest.clearAllMocks();
            resetMockObjects();
        });

        it('normal', async function() {
            player.connectedRetVal = true;
            await nowPlaying.execute(interaction, players);
            expect(player.getNowPlaying).toHaveBeenCalledTimes(1);
            expect(player.getProgress).toHaveBeenCalledTimes(1);
            expect(buildProgressBar).toHaveBeenCalledTimes(1);
            expect(prettifyTime).toHaveBeenCalledTimes(2);
        });

        it('nothing playing', async function() {
            player.connectedRetVal = true;
            player.pbItem = null;
            await nowPlaying.execute(interaction, players);
            expect(player.getNowPlaying).toHaveBeenCalledTimes(1);
            expect(player.getProgress).toHaveBeenCalledTimes(1);
            expect(buildProgressBar).toHaveBeenCalledTimes(0);
            expect(prettifyTime).toHaveBeenCalledTimes(0);
        });

        it('conn == null', async function() {
            await nowPlaying.execute(interaction, players);
            expect(player.getNowPlaying).toHaveBeenCalledTimes(0);
            expect(player.getProgress).toHaveBeenCalledTimes(0);
        });
    });
});