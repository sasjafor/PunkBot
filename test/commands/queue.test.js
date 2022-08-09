import { eventCollector, interaction, player, players } from '../discord-js.mocks.js';

import { AudioPlayerStatus } from '@discordjs/voice';

import * as queue from '../../src/commands/queue.js';

import { buttons } from '../../src/lib/componentIDs.js';
import { prettifyTime } from '../../src/lib/util.js';
jest.mock('../../src/lib/util.js');

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

            interaction.integerOption = 1;
        });

        it('normal', async function() {
            await queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(2);
        });

        it('index > 1', async function() {
            interaction.integerOption = 2;
            await queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(2);
        });

        it('index > numTabs', async function() {
            interaction.integerOption = 3;
            await queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(1);
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
            player.conn = null;
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
            expect(prevButton.update).toHaveBeenCalledTimes(2);
        });

        it('collect next button', async function() {
            let res = queue.execute(interaction, players);
            eventCollector.emit('collect', nextButton);
            await res;
            expect(nextButton.update).toHaveBeenCalledTimes(2);
        });
    });
});