import { interaction, player, players, resetMockObjects } from 'discord-js.mocks.js';

import * as clear from 'commands/clear';

describe('commands', function () {
    describe('clear', function () {
        beforeEach(() => {
            jest.clearAllMocks();
            resetMockObjects();
        });

        it('normal', async function() {
            player.connectedRetVal = true;
            await clear.execute(interaction, players);
            expect(player.clear).toHaveBeenCalledTimes(1);
        });

        it('conn == null', async function() {
            await clear.execute(interaction, players);
            expect(player.clear).toHaveBeenCalledTimes(0);
        });
    });
});