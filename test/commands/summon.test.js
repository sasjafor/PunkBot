import * as summon from '../../src/commands/summon.js';

describe('commands', function () {
    describe('summon', function () {
        const guildId = 1234;

        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
            editReply: jest.fn(),
            member: {
                voice: {
                    channel: {
                        joinable: true,
                    },
                },
            },
        };

        const player = {
            connect: jest.fn(() => Promise.resolve()),
        };

        const players = { };
        players[guildId] = player;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('normal', async function() {
            await summon.execute(interaction, players);
            expect(player.connect).toHaveBeenCalledTimes(1);
        });

        it('not joinable', async function() {
            interaction.member.voice.channel.joinable = false;
            await summon.execute(interaction, players);
            expect(player.connect).toHaveBeenCalledTimes(0);
        });
    });
});