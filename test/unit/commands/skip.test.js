import { interaction, player, players, resetMockObjects } from 'discord-js.mocks';

import * as skip from 'commands/skip';

describe('commands', function () {
    describe('skip', function () {
        beforeEach(() => {
            jest.clearAllMocks();
            resetMockObjects();
        });

        it('normal', async function() {
            player.connectedRetVal = true;
            await skip.execute(interaction, players);
            expect(player.skip).toHaveBeenCalledTimes(1);
        });

        it('skip failed', async function() {
            player.connectedRetVal = true;
            player.skipRetVal = null;
            await skip.execute(interaction, players);
            expect(player.skip).toHaveBeenCalledTimes(1);
        });


        it('conn == null', async function() {
            await skip.execute(interaction, players);
            expect(player.skip).toHaveBeenCalledTimes(0);
        });
    });
});