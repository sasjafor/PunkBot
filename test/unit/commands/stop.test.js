import { interaction, player, players, resetMockObjects } from 'discord-js.mocks';

import * as stop from 'commands/stop';

import { errorCode } from 'lib/errors';

describe('commands', function () {
    describe('stop', function () {
        beforeEach(() => {
            jest.clearAllMocks();
            resetMockObjects();
        });

        it('normal', async function() {
            player.connectedRetVal = true;
            await stop.execute(interaction, players);
            expect(player.stop).toHaveBeenCalledTimes(1);
        });

        it('nothing playing', async function() {
            player.connectedRetVal = true;
            player.stopRetVal = errorCode.NOT_PLAYING;
            await stop.execute(interaction, players);
            expect(player.stop).toHaveBeenCalledTimes(1);
        });

        it('conn == null', async function() {
            await stop.execute(interaction, players);
            expect(player.stop).toHaveBeenCalledTimes(0);
        });
    });
});