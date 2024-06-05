import { interaction, player, players, resetMockObjects } from 'discord-js.mocks';

import * as seek from 'commands/seek';

import { errorCode } from 'lib/errors';

import { prettifyTime } from 'lib/util';
jest.mock('lib/util');

describe('commands', function () {
    describe('seek', function () {
        beforeEach(() => {
            jest.clearAllMocks();
            resetMockObjects();

            interaction.stringOption = '2:30:53';
        });

        it('normal', async function() {
            player.connectedRetVal = true;
            await seek.execute(interaction, players);
            expect(player.seek).toHaveBeenCalledTimes(1);
            expect(prettifyTime).toHaveBeenCalledTimes(1);
        });

        it('not playing', async function() {
            player.connectedRetVal = true;
            player.seekRetVal = errorCode.NOT_PLAYING;
            await seek.execute(interaction, players);
            expect(player.seek).toHaveBeenCalledTimes(1);
            expect(prettifyTime).toHaveBeenCalledTimes(0);
        });

        it('seek error', async function() {
            player.connectedRetVal = true;
            player.seekRetVal = errorCode.SEEK_ERROR;
            await seek.execute(interaction, players);
            expect(player.seek).toHaveBeenCalledTimes(1);
            expect(prettifyTime).toHaveBeenCalledTimes(0);
        });

        it('long seek time', async function() {
            player.connectedRetVal = true;
            await seek.execute(interaction, players);
            expect(player.seek).toHaveBeenCalledTimes(1);
            expect(prettifyTime).toHaveBeenCalledTimes(1);
        });

        it('invalid seek time', async function() {
            player.connectedRetVal = true;
            interaction.stringOption = 'aksf';
            await seek.execute(interaction, players);
            expect(player.seek).toHaveBeenCalledTimes(0);
            expect(prettifyTime).toHaveBeenCalledTimes(0);
        });

        it('conn == null', async function() {
            await seek.execute(interaction, players);
            expect(player.seek).toHaveBeenCalledTimes(0);
            expect(prettifyTime).toHaveBeenCalledTimes(0);
        });
    });
});