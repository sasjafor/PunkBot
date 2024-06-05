import { interaction, player, players, resetMockObjects } from 'discord-js.mocks';

import * as shuffle from 'commands/shuffle';

describe('commands', function () {
    describe('shuffle', function () {
        beforeEach(() => {
            jest.clearAllMocks();
            resetMockObjects();
        });

        it('normal', async function() {
            player.connectedRetVal = true;
            await shuffle.execute(interaction, players);
            expect(player.shuffle).toHaveBeenCalledTimes(1);
        });

        it('conn == null', async function() {
            await shuffle.execute(interaction, players);
            expect(player.shuffle).toHaveBeenCalledTimes(0);
        });
    });
});