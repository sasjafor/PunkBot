import { interaction, player, players, resetMockObjects } from 'discord-js.mocks';

import * as resume from 'commands/resume';

import { errorCode } from 'lib/errors';

describe('commands', function () {
    describe('resume', function () {
        beforeEach(() => {
            jest.clearAllMocks();
            resetMockObjects();
        });

        it('normal', async function() {
            player.connectedRetVal = true;
            await resume.execute(interaction, players);
            expect(player.resume).toHaveBeenCalledTimes(1);
        });

        it('nothing playing', async function() {
            player.connectedRetVal = true;
            player.resumeRetVal = errorCode.NOT_PLAYING;
            await resume.execute(interaction, players);
            expect(player.resume).toHaveBeenCalledTimes(1);
        });

        it('already playing', async function() {
            player.connectedRetVal = true;
            player.resumeRetVal = errorCode.ALREADY_PLAYING;
            await resume.execute(interaction, players);
            expect(player.resume).toHaveBeenCalledTimes(1);
        });

        it('conn == null', async function() {
            await resume.execute(interaction, players);
            expect(player.resume).toHaveBeenCalledTimes(0);
        });
    });
});