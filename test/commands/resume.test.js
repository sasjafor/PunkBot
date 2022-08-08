import * as resume from '../../src/commands/resume.js';

describe('commands', function () {
    describe('resume', function () {
        const guildId = 1234;

        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
            editReply: jest.fn(),
        };

        var resumeRetVal = 0;
        const player = {
            conn: 'Legit Connection',
            resume: jest.fn(() => { return resumeRetVal; }),
        };

        const players = { };
        players[guildId] = player;

        beforeEach(() => {
            jest.clearAllMocks();

            resumeRetVal = 0;
        });

        it('normal', async function() {
            await resume.execute(interaction, players);
            expect(player.resume).toHaveBeenCalledTimes(1);
        });

        it('nothing playing', async function() {
            resumeRetVal = 1;
            await resume.execute(interaction, players);
            expect(player.resume).toHaveBeenCalledTimes(1);
        });

        it('already playing', async function() {
            resumeRetVal = 2;
            await resume.execute(interaction, players);
            expect(player.resume).toHaveBeenCalledTimes(1);
        });

        it('conn == null', async function() {
            player.conn = null;
            await resume.execute(interaction, players);
            expect(player.resume).toHaveBeenCalledTimes(0);
        });
    });
});