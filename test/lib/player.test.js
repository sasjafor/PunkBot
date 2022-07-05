import * as player from '../../src/lib/player.js';

jest.mock('winston', () => ({
    format: {
        colorize: jest.fn(),
        combine: jest.fn(),
        errors: jest.fn(),
        label: jest.fn(),
        printf: jest.fn(),
        timestamp: jest.fn(),
    },
    createLogger: jest.fn().mockReturnValue({
        debug: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
    }),
    transports: {
        Console: jest.fn(),
    },
}));

const mockConn = {
    on: jest.fn(),
    destroy: jest.fn(),
    subscribe: jest.fn(),
};

const mockAudioPlayer = {
    stop: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
};

import { AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    NoSubscriberBehavior,
    StreamType } from '@discordjs/voice';
jest.mock('@discordjs/voice', () => {
    return {
        AudioPlayerStatus: '',
        AudioPlayer: jest.fn(),
        joinVoiceChannel: jest.fn(() => {
            return mockConn;
        }),
        createAudioPlayer: jest.fn(() => {
            return mockAudioPlayer;
        }),
        NoSubscriberBehavior: '',
    };
});

import got from 'got';
import moment from 'moment';
jest.mock('got');

global.console.log = jest.fn();
global.console.trace = jest.fn();

describe('lib', function () {
    describe('player', function () {
        const playerObj = new player.Player();
        const np = {
            duration: moment.duration(300),
        };
        const playbackDurationVal = 120;
        const queue = playerObj.queue;
        // const joinConfig = {
        //     guildId: '',
        //     channelId: '',
        //     selfDeaf: false,
        //     selfMute: false,
        //     group: '',
        // };
        // const createVoiceConnectionOptions = {
        //     adapterCreator: {},
        // };
        const channel = {
            id: '',
            guild: {
                id: '',
                voiceAdapterCreator: '',
            },
        };

        playerObj.queue.enqueue(np);

        beforeEach(() => {
            jest.clearAllMocks();

            // @ts-ignore:next-line
            playerObj.dispatcher = mockAudioPlayer;
            // @ts-ignore:next-line
            playerObj.conn = mockConn;
            playerObj.stream = {
                playbackDuration: playbackDurationVal,
            };
            playerObj.nowPlaying = np;
            playerObj.queue = queue;
        });

        describe('connect', function () {
            it('normal', async function() {
                playerObj.dispatcher = null;
                let res = playerObj.connect(channel);
                expect(mockConn.subscribe).toBeCalledTimes(1);
            });

            it('fail', async function() {
                let res = playerObj.connect();
                expect(mockConn.subscribe).toBeCalledTimes(0);
            });
        });

        describe('disconnect', function () {
            it('normal', function () {
                let res = playerObj.disconnect();
                expect(res).toBeTruthy();
            });

            it('fail', function () {
                playerObj.conn = null;
                let res = playerObj.disconnect();
                expect(res).toBeFalsy();
            });
        });

        describe('shuffle', function () {
            it('normal', function () {
                // this doesn't really test anything, maybe mock queue?
                playerObj.shuffle();
            });
        });

        describe('currentPlaybackProgress', function () {
            it('normal', function () {
                let playbackProgress = playerObj.currentPlaybackProgress();
                expect(playbackProgress).toBe(playbackDurationVal);
            });

            it('fail', function () {
                playerObj.dispatcher = null;
                let playbackProgress = playerObj.currentPlaybackProgress();
                expect(playbackProgress).toBeFalsy();
            });
        });

        describe('getTotalRemainingPlaybackTime', function () {
            it('normal', async function () {
                let remainingPlaybackTime = await playerObj.getTotalRemainingPlaybackTime();
                expect(remainingPlaybackTime.toString()).toEqual('PT0.48S');
            });
        });

        describe('getTotalQueueTime', function () {
            it('normal', async function () {
                let queueTime = await playerObj.getTotalQueueTime();
                expect(queueTime.toString()).toEqual('PT0.3S');
            });
        });

        describe('getNowPlaying', function () {
            it('normal', function () {
                let nowPlaying = playerObj.getNowPlaying();
                expect(nowPlaying).toBe(np);
            });
        });

        describe('getProgress', function () {
            it('normal', function () {
                let progress = playerObj.getProgress();
                expect(progress.toString()).toEqual('PT0.12S');
            });

            it('fail', function () {
                playerObj.dispatcher = null;
                let progress = playerObj.getProgress();
                expect(progress).toBeFalsy();
            });
        });

        describe('getQueueLength', function () {
            it('normal', function () {
                let queueLength = playerObj.getQueueLength();
                expect(queueLength).toBe(playerObj.queue.getLength());
            });
        });

        describe('getQueue', function () {
            it('normal', function () {
                let queue = playerObj.getQueue();
                expect(queue).toBe(playerObj.queue);
            });
        });
    });
});