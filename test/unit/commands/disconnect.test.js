import { interaction, player, players, resetMockObjects } from 'discord-js.mocks';

import * as disconnect from 'commands/disconnect';

import { errorCode } from 'lib/errors';

describe('commands', function () {
    describe('disconnect', function () {
        beforeEach(() => {
            jest.clearAllMocks();
            resetMockObjects();
        });

        it('normal', async function() {
            player.connectedRetVal = true;
            await disconnect.execute(interaction, players);
            expect(player.disconnect).toHaveBeenCalledTimes(1);
        });

        it('disconnect failed', async function() {
            player.connectedRetVal = true;
            player.disconnectRetVal = errorCode.ERROR;
            await disconnect.execute(interaction, players);
            expect(player.disconnect).toHaveBeenCalledTimes(1);
        });

        it('conn == null', async function() {
            await disconnect.execute(interaction, players);
            expect(player.disconnect).toHaveBeenCalledTimes(0);
        });
    });
});