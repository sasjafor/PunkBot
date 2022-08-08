import { interaction, player, players } from '../discord-js.mocks.js';

import * as disconnect from '../../src/commands/disconnect.js';

describe('commands', function () {
    describe('disconnect', function () {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('normal', async function() {
            await disconnect.execute(interaction, players);
            expect(player.disconnect).toHaveBeenCalledTimes(1);
        });

        it('disconnect failed', async function() {
            player.disconnect = jest.fn(() => { return false; });
            await disconnect.execute(interaction, players);
            expect(player.disconnect).toHaveBeenCalledTimes(1);
        });

        it('conn == null', async function() {
            player.conn = null;
            await disconnect.execute(interaction, players);
            expect(player.disconnect).toHaveBeenCalledTimes(0);
        });
    });
});