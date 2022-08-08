import { interaction, player, players } from '../discord-js.mocks.js';

import * as loop from '../../src/commands/loop.js';

describe('commands', function () {
    describe('loop', function () {
        beforeEach(() => {
            jest.clearAllMocks();
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