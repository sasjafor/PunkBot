import * as loop from '../../src/commands/loop.js';

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

        it('false => true', async function() {
            player.loop = false;
            await loop.execute(interaction, players);
            expect(player.loop).toBe(true);
        });

        it('true => false', async function() {
            player.loop = true;
            await loop.execute(interaction, players);
            expect(player.loop).toBe(false);
        });
    });
});