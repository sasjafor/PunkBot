import { interaction, player, players } from '../discord-js.mocks.js';

import * as clear from '../../src/commands/clear.js';

describe('commands', function () {
    describe('clear', function () {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('normal', async function() {
            await clear.execute(interaction, players);
            expect(player.clear).toHaveBeenCalledTimes(1);
        });

        it('conn == null', async function() {
            player.conn = null;
            await clear.execute(interaction, players);
            expect(player.clear).toHaveBeenCalledTimes(0);
        });
    });
});