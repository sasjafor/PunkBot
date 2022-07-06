// @ts-nocheck
import * as player from '../../src/lib/player.js';
import { EventEmitter } from 'events';

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

const mockConn = new EventEmitter();
mockConn.destroy = jest.fn();
mockConn.subscribe = jest.fn();

const mockAudioPlayer = new EventEmitter();
mockAudioPlayer.pause = jest.fn();
mockAudioPlayer.unpause = jest.fn();
mockAudioPlayer.stop = jest.fn();
mockAudioPlayer.state = {
    status: AudioPlayerStatus.Idle,
};

import {
    _createAudioPlayer,
    _createAudioResource,
    _joinVoiceChannel,
    _NoSubscriberBehavior,
    _StreamType,
    AudioPlayerStatus
} from '@discordjs/voice';
jest.mock('@discordjs/voice', () => {
    return {
        AudioPlayerStatus: {
            Idle: 'idle',
            Buffering: 'buffering',
            Paused: 'paused',
            Playing: 'playing',
            AutoPaused: 'autopaused',
        },
        AudioPlayer: jest.fn(),
        joinVoiceChannel: jest.fn(() => {
            return mockConn;
        }),
        createAudioPlayer: jest.fn(() => {
            return mockAudioPlayer;
        }),
        createAudioResource: jest.fn(() => {
            return {};
        }),
        NoSubscriberBehavior: '',
        StreamType: '',
    };
});

const mockPlayStream = {
    type: '',
    stream: new EventEmitter(),
};
var mockPlayThrowErr = false;

import playdl from 'play-dl';
jest.mock('play-dl', () => {
    return {
        stream: jest.fn(() => {
            if (mockPlayThrowErr) {
                throw new Error();
            } else {
                return mockPlayStream;
            }
        }),
    };
});

import got from 'got';
import moment from 'moment';
import { resolveMx } from 'dns';
jest.mock('got', () => {
    return {
        stream: jest.fn(() => {
            return {
                pipe: jest.fn(() => {
                    return mockPlayStream.stream;
                }),
            };
        }),
    };
});

import prism from 'prism-media';
jest.mock('prism-media');

global.console.log = jest.fn();
global.console.trace = jest.fn();
global.setTimeout = jest.fn();

describe('lib', function () {
    describe('player', function () {
        const playerObj = new player.Player();
        const np = {
            duration: moment.duration(30000),
        };
        const playbackDurationVal = 120;
        const queue = playerObj.queue;
        const next = playerObj.next;
        const dispatch = playerObj.dispatch;
        const createStream = playerObj.createStream;
        const skip = playerObj.skip;

        const videoURL = 'https://www.youtube.com/watch?v=E8gmARGvPlI';
        const fileURL = 'https://static.wikia.nocookie.net/smite_gamepedia/images/d/db/ClassyFenrir_Ability_2a.ogg';

        const seekTime = 21;

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
            playerObj.next = next;
            playerObj.dispatch = dispatch;
            playerObj.createStream = createStream;
            playerObj.skip = skip;

            mockPlayStream.stream.readable = true;
            mockPlayThrowErr = false;
        });

        describe('createStream', function () {
            const videoUnavailable = 'This video is not available.';
            const prematureClose = 'Premature close';
            const streamError = {
                message: '',
            };

            it('normal video', async function () {
                let res = await playerObj.createStream(videoURL);
                expect(res).toBeTruthy();
            });

            it('normal file', async function () {
                let res = await playerObj.createStream(fileURL);
                expect(res).toBeTruthy();
            });

            it('stream not readable', async function () {
                mockPlayStream.stream.readable = false;

                let res = playerObj.createStream(videoURL);
                playerObj.createStream = null;
                expect(res).rejects.toThrowError();
            });

            it('stream error generic', async function () {
                let res = playerObj.createStream(videoURL);
                mockPlayStream.stream.emit('error', streamError);
                expect(await res).toBeTruthy();
            });

            it('stream error video unavailable', async function () {
                streamError.message = videoUnavailable;
                let res = playerObj.createStream(videoURL);
                mockPlayStream.stream.emit('error', streamError);
                expect(await res).toBeTruthy();
            });

            it('stream error prematureClose', async function () {
                streamError.message = prematureClose;
                let res = playerObj.createStream(videoURL);
                mockPlayStream.stream.emit('error', streamError);
                expect(await res).toBeTruthy();
            });

            it('playStream error', async function () {
                mockPlayThrowErr = true;
                let res = await playerObj.createStream(videoURL);
                expect(res).toStrictEqual({'errorCode': 1});
            });
        });

        describe('clear', function () {
            it('normal', function () {
                playerObj.clear();
                expect(playerObj.queue.getLength()).toBe(0);
            });
        });

        describe('remove', function () {
            it('normal', function () {
                let res = playerObj.remove(1);
                expect(res).toBe(np);

                playerObj.queue.enqueue(np);
            });

            it('fail', function () {
                let res = playerObj.remove(0);
                expect(res).toBeFalsy();
            });
        });

        describe('seek', function () {
            beforeEach(() => {
                playerObj.dispatcher.state.status = AudioPlayerStatus.Playing;

                playerObj.dispatch = jest.fn();
                playerObj.createStream = jest.fn();
            });

            it('normal', async function () {
                let res = await playerObj.seek(seekTime);
                expect(res).toBe(0);
            });

            it('not playing', async function () {
                playerObj.dispatcher.state.status = AudioPlayerStatus.Idle;

                let res = await playerObj.seek(seekTime);
                expect(res).toBe(2);
            });

            it('seek time too long', async function () {
                playerObj.dispatcher.state.status = AudioPlayerStatus.Idle;

                let res = await playerObj.seek(50);
                expect(res).toBe(2);
            });
        });

        describe('connect', function () {
            beforeEach(() => {
                playerObj.next = jest.fn();
            });

            it('normal', async function () {
                playerObj.dispatcher = null;
                await playerObj.connect(channel);
                expect(mockConn.subscribe).toBeCalledTimes(1);
            });

            it('fail', async function () {
                let res = playerObj.connect(channel);
                mockAudioPlayer.emit('error');
                await res;
                expect(mockConn.subscribe).toBeCalledTimes(0);
            });

            it('idle', async function () {
                let res = playerObj.connect(channel);
                mockAudioPlayer.emit(AudioPlayerStatus.Idle);
                await res;
                expect(mockConn.subscribe).toBeCalledTimes(0);
            });

            it('conn error', async function () {
                playerObj.dispatcher.state.status = AudioPlayerStatus.Paused;

                let res = playerObj.connect(channel);
                mockConn.emit('error');
                await res;
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
                expect(remainingPlaybackTime.toString()).toEqual('PT59.88S');
            });
        });

        describe('getTotalQueueTime', function () {
            it('normal', async function () {
                let queueTime = await playerObj.getTotalQueueTime();
                expect(queueTime.toString()).toEqual('PT30S');
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