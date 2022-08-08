import { interaction, player, players } from '../discord-js.mocks.js';

import * as seek from '../../src/commands/seek.js';

import { prettifyTime } from '../../src/lib/util.js';
jest.mock('../../src/lib/util.js');

describe('commands', function () {
    describe('seek', function () {
        beforeEach(() => {
            jest.clearAllMocks();

            player.seek.mockResolvedValue(0);
        });

        it('normal', async function() {
            player.seek.mockResolvedValue(0);
            await seek.execute(interaction, players);
            expect(player.seek).toHaveBeenCalledTimes(1);
            expect(prettifyTime).toHaveBeenCalledTimes(1);
        });

        it('normal', async function() {
            player.seek.mockResolvedValue(3);
            await seek.execute(interaction, players);
            expect(player.seek).toHaveBeenCalledTimes(1);
            expect(prettifyTime).toHaveBeenCalledTimes(0);
        });

        it('normal', async function() {
            player.seek.mockResolvedValue(2);
            await seek.execute(interaction, players);
            expect(player.seek).toHaveBeenCalledTimes(1);
            expect(prettifyTime).toHaveBeenCalledTimes(0);
        });

        it('long seek time', async function() {
            interaction.stringOption = '2:30:53';
            await seek.execute(interaction, players);
            expect(player.seek).toHaveBeenCalledTimes(1);
            expect(prettifyTime).toHaveBeenCalledTimes(1);
        });

        it('invalid seek time', async function() {
            interaction.stringOption = 'aksf';
            await seek.execute(interaction, players);
            expect(player.seek).toHaveBeenCalledTimes(0);
            expect(prettifyTime).toHaveBeenCalledTimes(0);
        });

        it('conn == null', async function() {
            player.conn = null;
            await seek.execute(interaction, players);
            expect(player.seek).toHaveBeenCalledTimes(0);
            expect(prettifyTime).toHaveBeenCalledTimes(0);
        });
    });
});