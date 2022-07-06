import { AudioPlayerStatus } from '@discordjs/voice';
import moment from 'moment';

import * as queue from '../../src/commands/queue.js';

import { prettifyTime } from '../../src/lib/util.js';
jest.mock('../../src/lib/util.js');

describe('commands', function () {
    describe('queue', function () {
        const guildId = 1234;

        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
            options: {
                getInteger: jest.fn(() => { return 1; }),
            },
            member: {
                displayAvatarURL: jest.fn(),
            },
        };

        const np = {
            duration: moment.duration('2:30'),
            title: 'Test',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            thumbnailURL: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            requesterIconURL: '',
            requesterId: '',
        };

        const queueObject = {
            get: jest.fn(() => { return np; }),
        };

        const player = {
            conn: 'Legit Connection',
            dispatcher: {
                state: {
                    status: AudioPlayerStatus.Playing,
                },
            },
            getNowPlaying: jest.fn(() => { return np; }),
            getQueueLength: jest.fn(() => { return 12; }),
            getQueue: jest.fn(() => { return queueObject; }),
            getTotalQueueTime: jest.fn(() => { return moment.duration('13:37'); }),
        };

        const players = { };
        players[guildId] = player;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('normal', async function() {
            await queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(1);
        });

        it('index > 1', async function() {
            interaction.options.getInteger = jest.fn(() => { return 2; });
            await queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(1);
        });

        it('index > numTabs', async function() {
            interaction.options.getInteger = jest.fn(() => { return 3; });
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
    });
});