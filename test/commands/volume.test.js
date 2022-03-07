import * as volume from '../../src/commands/volume.js';

describe('commands', function () {
    describe('volume', function () {
        const guildId = 1234;

        const volumeVal = 2;
        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
            options: {
                getNumber: jest.fn(() => { return volumeVal; }),
            },
        };

        const player = {
            setVolume: jest.fn(),
        };

        const players = { };
        players[guildId] = player;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('normal', async function() {
            await volume.execute(interaction, players);
            expect(player.setVolume).toHaveBeenCalledWith(volumeVal);
            expect(player.setVolume).toHaveBeenCalledTimes(1);
        });
    });
});