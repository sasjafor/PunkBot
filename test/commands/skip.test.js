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

        const nowPlaying = {
            title: '',
        };

        const player = {
            conn: 'Legit Connection',
            skip: jest.fn(() => { return true; }),
            getNowPlaying: jest.fn(() => { return nowPlaying; }),
        };

        const players = { };
        players[guildId] = player;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('normal', async function() {
            await skip.execute(interaction, players);
            expect(player.skip).toHaveBeenCalledTimes(1);
        });

        it('skip failed', async function() {
            player.skip = jest.fn(() => { return false; });
            await skip.execute(interaction, players);
            expect(player.skip).toHaveBeenCalledTimes(1);
        });


        it('conn == null', async function() {
            player.conn = null;
            await skip.execute(interaction, players);
            expect(player.skip).toHaveBeenCalledTimes(0);
        });
    });
});