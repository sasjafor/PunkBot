import * as remove from '../../src/commands/remove.js';

describe('commands', function () {
    describe('remove', function () {
        const guildId = 1234;

        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
            editReply: jest.fn(),
            options: {
                getInteger: jest.fn(() => { return 2; }),
            },
        };

        const player = {
            conn: 'Legit Connection',
            remove: jest.fn(() => { return true; }),
        };

        const players = { };
        players[guildId] = player;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('normal', async function() {
            await remove.execute(interaction, players);
            expect(player.remove).toHaveBeenCalledTimes(1);
        });

        it('remove failed', async function() {
            player.remove = jest.fn(() => { return false; });
            await remove.execute(interaction, players);
            expect(player.remove).toHaveBeenCalledTimes(1);
        });


        it('conn == null', async function() {
            player.conn = null;
            await remove.execute(interaction, players);
            expect(player.remove).toHaveBeenCalledTimes(0);
        });
    });
});