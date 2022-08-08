import { interaction, player, players } from '../discord-js.mocks.js';

import * as pause from '../../src/commands/pause.js';

describe('commands', function () {
    describe('pause', function () {
        beforeEach(() => {
            jest.clearAllMocks();

            player.pauseRetVal = 0;
        });

        it('normal', async function() {
            await pause.execute(interaction, players);
            expect(player.pause).toHaveBeenCalledTimes(1);
        });

        it('nothing playing', async function() {
            player.pauseRetVal = 1;
            await pause.execute(interaction, players);
            expect(player.pause).toHaveBeenCalledTimes(1);
        });

        it('already paused', async function() {
            player.pauseRetVal = 2;
            await pause.execute(interaction, players);
            expect(player.pause).toHaveBeenCalledTimes(1);
        });

        it('conn == null', async function() {
            player.conn = null;
            await pause.execute(interaction, players);
            expect(player.pause).toHaveBeenCalledTimes(0);
        });
    });
});