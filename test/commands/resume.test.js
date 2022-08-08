import { interaction, player, players } from '../discord-js.mocks.js';

import * as resume from '../../src/commands/resume.js';

describe('commands', function () {
    describe('resume', function () {
        beforeEach(() => {
            jest.clearAllMocks();

            player.resumeRetVal = 0;
        });

        it('normal', async function() {
            await resume.execute(interaction, players);
            expect(player.resume).toHaveBeenCalledTimes(1);
        });

        it('nothing playing', async function() {
            player.resumeRetVal = 1;
            await resume.execute(interaction, players);
            expect(player.resume).toHaveBeenCalledTimes(1);
        });

        it('already playing', async function() {
            player.resumeRetVal = 2;
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