import * as clear from '../../src/commands/clear.js';

describe('commands', function () {
    describe('clear', function () {
        const guildId = 1234;

        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
            editReply: jest.fn(),
        };

        const player = {
            conn: 'Legit Connection',
            clear: jest.fn(),
        };

        const players = { };
        players[guildId] = player;

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