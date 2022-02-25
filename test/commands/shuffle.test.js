import * as shuffle from '../../src/commands/shuffle.js';

describe('commands', function () {
    describe('shuffle', function () {
        const guildId = 1234;

        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
        };

        const player = {
            conn: 'Legit Connection',
            shuffle: jest.fn(),
        };

        const players = { };
        players[guildId] = player;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('normal', function() {
            shuffle.execute(interaction, players);
            expect(player.shuffle).toHaveBeenCalledTimes(1);
        });

        it('conn == null', function() {
            player.conn = null;
            shuffle.execute(interaction, players);
            expect(player.shuffle).toHaveBeenCalledTimes(0);
        });
    });
});