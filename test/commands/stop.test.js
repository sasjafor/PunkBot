import * as stop from '../../src/commands/stop.js';

describe('commands', function () {
    describe('stop', function () {
        const guildId = 1234;

        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
        };

        var stopRetVal = 0;
        const player = {
            conn: 'Legit Connection',
            stop: jest.fn(() => { return stopRetVal; }),
        };

        const players = { };
        players[guildId] = player;

        beforeEach(() => {
            jest.clearAllMocks();

            stopRetVal = 0;
        });

        it('normal', async function() {
            await stop.execute(interaction, players);
            expect(player.stop).toHaveBeenCalledTimes(1);
        });

        it('nothing playing', async function() {
            stopRetVal = 1;
            await stop.execute(interaction, players);
            expect(player.stop).toHaveBeenCalledTimes(1);
        });

        it('conn == null', async function() {
            player.conn = null;
            await stop.execute(interaction, players);
            expect(player.stop).toHaveBeenCalledTimes(0);
        });
    });
});