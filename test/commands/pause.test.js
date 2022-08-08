import * as pause from '../../src/commands/pause.js';

describe('commands', function () {
    describe('pause', function () {
        const guildId = 1234;

        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
            editReply: jest.fn(),
        };

        var pauseRetVal = 0;
        const player = {
            conn: 'Legit Connection',
            pause: jest.fn(() => { return pauseRetVal; }),
        };

        const players = { };
        players[guildId] = player;

        beforeEach(() => {
            jest.clearAllMocks();

            pauseRetVal = 0;
        });

        it('normal', async function() {
            await pause.execute(interaction, players);
            expect(player.pause).toHaveBeenCalledTimes(1);
        });

        it('nothing playing', async function() {
            pauseRetVal = 1;
            await pause.execute(interaction, players);
            expect(player.pause).toHaveBeenCalledTimes(1);
        });

        it('already paused', async function() {
            pauseRetVal = 2;
            await pause.execute(interaction, players);
            expect(player.pause).toHaveBeenCalledTimes(1);
        });

        it('conn == null', async function() {
            player.conn = null;
            await pause.execute(interaction, players);
            expect(player.pause).toHaveBeenCalledTimes(0);
        });
    });
});