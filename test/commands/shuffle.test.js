import { interaction, player, players } from '../discord-js.mocks.js';

import * as shuffle from '../../src/commands/shuffle.js';

describe('commands', function () {
    describe('shuffle', function () {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('normal', async function() {
            await shuffle.execute(interaction, players);
            expect(player.shuffle).toHaveBeenCalledTimes(1);
        });

        it('conn == null', async function() {
            player.conn = null;
            await shuffle.execute(interaction, players);
            expect(player.shuffle).toHaveBeenCalledTimes(0);
        });
    });
});