import * as skip from '../../src/commands/skip.js';

describe('commands', function () {
    describe('skip', function () {
        const guildId = 1234;

        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
        };

        const player = {
            conn: 'Legit Connection',
            skip: jest.fn(() => { return true; }),
        };

        const players = { };
        players[guildId] = player;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('normal', function() {
            skip.execute(interaction, players);
            expect(player.skip).toHaveBeenCalledTimes(1);
        });

        it('skip failed', function() {
            player.skip = jest.fn(() => { return false; });
            skip.execute(interaction, players);
            expect(player.skip).toHaveBeenCalledTimes(1);
        });


        it('conn == null', function() {
            player.conn = null;
            skip.execute(interaction, players);
            expect(player.skip).toHaveBeenCalledTimes(0);
        });
    });
});