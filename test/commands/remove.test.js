import * as remove from '../../src/commands/remove.js';

describe('commands', function () {
    describe('remove', function () {
        const guildId = 1234;

        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
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

        it('normal', function() {
            remove.execute(interaction, players);
            expect(player.remove).toHaveBeenCalledTimes(1);
        });

        it('remove failed', function() {
            player.remove = jest.fn(() => { return false; });
            remove.execute(interaction, players);
            expect(player.remove).toHaveBeenCalledTimes(1);
        });


        it('conn == null', function() {
            player.conn = null;
            remove.execute(interaction, players);
            expect(player.remove).toHaveBeenCalledTimes(0);
        });
    });
});