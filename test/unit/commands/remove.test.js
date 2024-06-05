import { interaction, player, players, resetMockObjects } from 'discord-js.mocks';

import * as remove from 'commands/remove';

describe('commands', function () {
    describe('remove', function () {
        beforeEach(() => {
            jest.clearAllMocks();
            resetMockObjects();
        });

        it('normal', async function() {
            player.connectedRetVal = true;
            await remove.execute(interaction, players);
            expect(player.remove).toHaveBeenCalledTimes(1);
        });

        it('remove failed', async function() {
            player.connectedRetVal = true;
            player.removeRetVal = null;
            await remove.execute(interaction, players);
            expect(player.remove).toHaveBeenCalledTimes(1);
        });


        it('conn == null', async function() {
            await remove.execute(interaction, players);
            expect(player.remove).toHaveBeenCalledTimes(0);
        });
    });
});