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
                avatarURL: jest.fn(),
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
            playing: true,
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

        it('normal', function() {
            queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(1);
        });

        it('index > 1', function() {
            interaction.options.getInteger = jest.fn(() => { return 2; });
            queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(1);
        });

        it('index > numTabs', function() {
            interaction.options.getInteger = jest.fn(() => { return 3; });
            queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(1);
        });

        it('getNowPlayingReturns nothing', function() {
            player.getNowPlaying = jest.fn();
            queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(0);
        });

        it('!player.playing', function() {
            player.playing = false;
            queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(0);
        });

        it('conn == null', function() {
            player.conn = null;
            queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(0);
        });

        it('index undefined', function() {
            interaction.options.getInteger = jest.fn();
            queue.execute(interaction, players);
            expect(player.getQueueLength).toHaveBeenCalledTimes(0);
        });
    });
});