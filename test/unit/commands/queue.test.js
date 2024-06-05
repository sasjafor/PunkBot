import { eventCollector, interaction, player, players, resetMockObjects } from 'discord-js.mocks';

import * as queue from 'commands/queue';

import { AudioPlayerStatus } from '@discordjs/voice';

import { buttons } from 'lib/componentIDs';
import { prettifyTime } from 'lib/util';
jest.mock('lib/util');

describe('commands', function () {
    describe('queue', function () {
        const prevButton = {
            customId: buttons.queuePrev,
            update: jest.fn(),
        };

        const nextButton = {
            customId: buttons.queueNext,
            update: jest.fn(),
        };

        beforeEach(() => {
            jest.clearAllMocks();
            resetMockObjects();
        });

        it('normal', async function() {
            player.connectedRetVal = true;
            player.playingRetVal = true;
            await queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(2);
        });

        it('index > 1', async function() {
            player.connectedRetVal = true;
            player.playingRetVal = true;
            interaction.integerOption = 2;
            await queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(2);
        });

        it('index > numTabs', async function() {
            player.connectedRetVal = true;
            player.playingRetVal = true;
            interaction.integerOption = 3;
            await queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(2);
        });

        it('getNowPlayingReturns nothing', async function() {
            player.getNowPlaying = jest.fn();
            await queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(0);
        });

        it('!player.playing', async function() {
            player.dispatcher.state.status = AudioPlayerStatus.Idle;
            await queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(0);
        });

        it('conn == null', async function() {
            await queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(0);
        });

        it('index undefined', async function() {
            interaction.options.getInteger = jest.fn();
            await queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(0);
            expect(prettifyTime).toHaveBeenCalledTimes(0);
        });

        it('collect prev button', async function() {
            let res = queue.execute(interaction, players);
            eventCollector.emit('collect', prevButton);
            await res;
            expect(prevButton.update).toHaveBeenCalledTimes(3);
        });

        it('collect next button', async function() {
            let res = queue.execute(interaction, players);
            eventCollector.emit('collect', nextButton);
            await res;
            expect(nextButton.update).toHaveBeenCalledTimes(3);
        });
    });
});