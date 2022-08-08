import { interaction, player, players } from '../discord-js.mocks.js';

import * as skip from '../../src/commands/skip.js';

describe('commands', function () {
    describe('skip', function () {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('normal', async function() {
            await skip.execute(interaction, players);
            expect(player.skip).toHaveBeenCalledTimes(1);
        });

        it('skip failed', async function() {
            player.skip = jest.fn(() => { return false; });
            await skip.execute(interaction, players);
            expect(player.skip).toHaveBeenCalledTimes(1);
        });


        it('conn == null', async function() {
            player.conn = null;
            await skip.execute(interaction, players);
            expect(player.skip).toHaveBeenCalledTimes(0);
        });
    });
});