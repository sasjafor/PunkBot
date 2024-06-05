import { interaction, player, players, resetMockObjects } from 'discord-js.mocks';

import * as pause from 'commands/pause';

import { errorCode } from 'lib/errors';

describe('commands', function () {
    describe('pause', function () {
        beforeEach(() => {
            jest.clearAllMocks();
            resetMockObjects();
        });

        it('normal', async function() {
            player.connectedRetVal = true;
            await pause.execute(interaction, players);
            expect(player.pause).toHaveBeenCalledTimes(1);
        });

        it('nothing playing', async function() {
            player.connectedRetVal = true;
            player.pauseRetVal = errorCode.NOT_PLAYING;
            await pause.execute(interaction, players);
            expect(player.pause).toHaveBeenCalledTimes(1);
        });

        it('already paused', async function() {
            player.connectedRetVal = true;
            player.pauseRetVal = errorCode.ALREADY_PAUSED;
            await pause.execute(interaction, players);
            expect(player.pause).toHaveBeenCalledTimes(1);
        });

        it('conn == null', async function() {
            await pause.execute(interaction, players);
            expect(player.pause).toHaveBeenCalledTimes(0);
        });
    });
});