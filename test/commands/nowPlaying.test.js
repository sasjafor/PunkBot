import * as nowPlaying from '../../src/commands/nowPlaying.js';

describe('commands', function () {
    describe('loop', function () {
        const guildId = 1234;

        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
        };

        const player = {
            conn: 'Legit Connection',
            loop: false,
        };

        const players = { };
        players[guildId] = player;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('false => true', function() {
            player.loop = false;
            nowPlaying.execute(interaction, players);
            expect(player.loop).toBe(true);
        });

        it('true => false', function() {
            player.loop = true;
            nowPlaying.execute(interaction, players);
            expect(player.loop).toBe(false);
        });
    });
});