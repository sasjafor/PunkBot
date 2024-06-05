import { interaction, player, players, resetMockObjects } from 'discord-js.mocks';

import * as loop from 'commands/loop';

describe('commands', function () {
    describe('loop', function () {
        beforeEach(() => {
            jest.clearAllMocks();
            resetMockObjects();
        });

        it('false => true', async function() {
            player.loop = false;
            await loop.execute(interaction, players);
            expect(player.loop).toBe(true);
        });

        it('true => false', async function() {
            player.loop = true;
            await loop.execute(interaction, players);
            expect(player.loop).toBe(false);
        });
    });
});