import * as seek from '../../src/commands/seek.js';

import { prettifyTime } from '../../src/lib/util.js';
jest.mock('../../src/lib/util.js');

describe('commands', function () {
    describe('seek', function () {
        const guildId = 1234;

        var seekTime = '1:25';
        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
            options: {
                getString: jest.fn(() => { return seekTime; }),
            },
        };

        const player = {
            conn: 'Legit Connection',
            seek: jest.fn(),
        };

        const players = { };
        players[guildId] = player;

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
            player.seek.mockResolvedValue(1);
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
            seekTime = '2:30:53';
            await seek.execute(interaction, players);
            expect(player.seek).toHaveBeenCalledTimes(1);
            expect(prettifyTime).toHaveBeenCalledTimes(1);
        });

        it('invalid seek time', async function() {
            seekTime = 'aksf';
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