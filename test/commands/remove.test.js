import { interaction, player, players } from '../discord-js.mocks.js';

import * as remove from '../../src/commands/remove.js';

describe('commands', function () {
    describe('remove', function () {
        beforeEach(() => {
            jest.clearAllMocks();

            interaction.integerOption = 2;
        });

        it('normal', async function() {
            await remove.execute(interaction, players);
            expect(player.remove).toHaveBeenCalledTimes(1);
        });

        it('remove failed', async function() {
            player.remove = jest.fn(() => { return false; });
            await remove.execute(interaction, players);
            expect(player.remove).toHaveBeenCalledTimes(1);
        });


        it('conn == null', async function() {
            player.conn = null;
            await remove.execute(interaction, players);
            expect(player.remove).toHaveBeenCalledTimes(0);
        });
    });
});