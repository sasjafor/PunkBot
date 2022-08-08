import { interaction, player, players } from '../discord-js.mocks.js';

import * as stop from '../../src/commands/stop.js';

describe('commands', function () {
    describe('stop', function () {
        beforeEach(() => {
            jest.clearAllMocks();

            player.stopRetVal = 0;
        });

        it('normal', async function() {
            await stop.execute(interaction, players);
            expect(player.stop).toHaveBeenCalledTimes(1);
        });

        it('nothing playing', async function() {
            player.stopRetVal = 1;
            await stop.execute(interaction, players);
            expect(player.stop).toHaveBeenCalledTimes(1);
        });

        it('conn == null', async function() {
            player.conn = null;
            await stop.execute(interaction, players);
            expect(player.stop).toHaveBeenCalledTimes(0);
        });
    });
});