import * as disconnect from '../../src/commands/disconnect.js';

describe('commands', function () {
    describe('disconnect', function () {
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
            disconnect: jest.fn(() => { return true; }),
        };

        const players = { };
        players[guildId] = player;

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