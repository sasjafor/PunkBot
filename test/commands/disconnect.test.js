import * as disconnect from '../../src/commands/disconnect.js';

describe('commands', function () {
    describe('disconnect', function () {
        const guildId = 1234;

        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
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

        it('normal', function() {
            disconnect.execute(interaction, players);
            expect(player.disconnect).toHaveBeenCalledTimes(1);
        });

        it('disconnect failed', function() {
            player.disconnect = jest.fn(() => { return false; });
            disconnect.execute(interaction, players);
            expect(player.disconnect).toHaveBeenCalledTimes(1);
        });

        it('conn == null', function() {
            player.conn = null;
            disconnect.execute(interaction, players);
            expect(player.disconnect).toHaveBeenCalledTimes(0);
        });
    });
});