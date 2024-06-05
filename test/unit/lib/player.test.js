import * as player from 'lib/player';

import { errorCode } from 'lib/errors';
import { Queue } from 'lib/queue';

import { _resolveMx } from 'dns';
import { EventEmitter } from 'events';
import moment from 'moment';

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
        warn: jest.fn(),
    }),
    transports: {
        Console: jest.fn(),
    },
}));

const mockConn = new EventEmitter();
mockConn.destroy = jest.fn();
mockConn.subscribe = jest.fn();
mockConn.disconnect = jest.fn();

const mockAudioPlayer = new EventEmitter();
var mockUnpauseRet = true;
var mockPauseRet = true;
var mockStopRet = true;
mockAudioPlayer.play = jest.fn();
mockAudioPlayer.pause = jest.fn(() => { return mockPauseRet; });
mockAudioPlayer.unpause = jest.fn(() => { return mockUnpauseRet; });
mockAudioPlayer.stop = jest.fn(() => { return mockStopRet; });
mockAudioPlayer.state = {
    status: AudioPlayerStatus.Idle,
};

import {
    _createAudioPlayer,
    _createAudioResource,
    _joinVoiceChannel,
    _NoSubscriberBehavior,
    _StreamType,
    AudioPlayerStatus,
    VoiceConnectionStatus,
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
        VoiceConnectionStatus: {
            Ready: 'ready',
            Connecting: 'connecting',
        },
        AudioPlayer: jest.fn(),
        joinVoiceChannel: jest.fn(() => {
            return mockConn;
        }),
        createAudioPlayer: jest.fn(() => {
            return mockAudioPlayer;
        }),
        createAudioResource: jest.fn(() => {
            return {
                volume: {
                    setVolume: jest.fn(),
                },
            };
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
const mockPlayErr = new Error();

import _playdl from 'play-dl';
jest.mock('play-dl', () => {
    return {
        stream: jest.fn(() => {
            if (mockPlayThrowErr) {
                throw mockPlayErr;
            } else {
                return mockPlayStream;
            }
        }),
    };
});

import _got from 'got';
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

import _prism from 'prism-media';
jest.mock('prism-media');

global.console.log = jest.fn();
global.console.trace = jest.fn();

describe('lib', function () {
    describe('player', function () {
        jest.useFakeTimers();

        const videoURL = 'https://www.youtube.com/watch?v=E8gmARGvPlI';
        const fileURL = 'https://static.wikia.nocookie.net/smite_gamepedia/images/d/db/ClassyFenrir_Ability_2a.ogg';

        const playerObj = new player.Player();
        playerObj.oldStream = {
            playStream: {
                destroy: jest.fn(),
            },
        };
        const np = {
            title: 'test',
            duration: moment.duration(30000),
            url: videoURL,
            stream: {
                volume: {
                    setVolume: jest.fn(),
                },
            },
        };
        const playbackDurationVal = 120;
        const next = playerObj.next;
        const dispatch = playerObj.dispatch;
        const createStream = playerObj.createStream;
        const prepareStream = playerObj.prepareStream;
        const disconnect = playerObj.disconnect;
        const dequeue = playerObj.dequeue;
        const enqueue = playerObj.enqueue;
        const skip = playerObj.skip;
        const play = playerObj.play;
        const stop = playerObj.stop;
        const peek = playerObj.peek;
        const playLoop = playerObj.playLoop;

        const seekTime = 21;

        const channel = {
            id: '',
            guild: {
                id: '',
                voiceAdapterCreator: '',
            },
        };

        beforeEach(() => {
            jest.clearAllMocks();

            playerObj.dispatcher = mockAudioPlayer;
            playerObj.dispatcher.state.status = AudioPlayerStatus.Idle;
            playerObj.conn = mockConn;
            playerObj.stream = {
                playbackDuration: playbackDurationVal,
                volume: {
                    setVolume: jest.fn(),
                },
                started: true,
                playStream: {
                    destroy: jest.fn(),
                },
            };
            np.stream = playerObj.stream;
            playerObj.loop = false;
            playerObj.nowPlaying = np;
            playerObj.next = next;
            playerObj.dispatch = dispatch;
            playerObj.createStream = createStream;
            playerObj.prepareStream = prepareStream;
            playerObj.disconnect = disconnect;
            playerObj.enqueue = enqueue;
            playerObj.dequeue = dequeue;
            playerObj.skip = skip;
            playerObj.play = play;
            playerObj.stop = stop;
            playerObj.peek = peek;
            playerObj.playLoop = playLoop;
            playerObj.queue = new Queue();
            playerObj.queue.enqueue(np);

            mockPlayStream.stream.readable = true;
            mockPlayThrowErr = false;

            mockUnpauseRet = true;
            mockPauseRet = true;
            mockStopRet = true;
        });

        describe('play', function () {
            beforeEach(() => {
                playerObj.dequeue = jest.fn(() => { return np; });
                playerObj.prepareStream = jest.fn(() => { return playerObj.stream; });
                playerObj.dispatch = jest.fn(() => { return true; });
                playerObj.peek = jest.fn(() => { return {}; });
            });

            it('normal', function () {
                let res = playerObj.play();
                expect(res).toBeTruthy();
            });

            it('no nowPlaying stream', function () {
                playerObj.nowPlaying.stream = undefined;
                let res = playerObj.play();
                expect(res).toBeTruthy();
            });

            it('with loop', function () {
                playerObj.loop = true;
                let res = playerObj.play();
                expect(res).toBeTruthy();
            });
        });

        describe('playLoop', function () {
            beforeEach(() => {
                playerObj.dequeue = jest.fn(() => { return np; });
                playerObj.prepareStream = jest.fn(() => { return playerObj.stream; });
                playerObj.dispatch = jest.fn(() => { return true; });
                playerObj.peek = jest.fn(() => { return {}; });
            });

            it('normal', async function () {
                let res = await playerObj.playLoop();
                expect(res).toBeUndefined();
            });

            it('no nowPlaying stream', async function () {
                playerObj.nowPlaying.stream = undefined;
                let res = await playerObj.playLoop();
                expect(res).toBeUndefined();
            });

            it('stream error', async function () {
                playerObj.nowPlaying.stream = { errorCode: 3 };
                let res = await playerObj.playLoop();
                expect(res).toBeUndefined();
            });

            it('stream ended', async function () {
                playerObj.nowPlaying.stream.ended = true;
                let res = await playerObj.playLoop();
                expect(res).toBeUndefined();
            });
        });

        describe('next', function () {
            it('normal', function () {
                playerObj.play = jest.fn();
                let res = playerObj.next();
                expect(res).toBeFalsy();
            });

            it('with loop', function () {
                playerObj.play = jest.fn();
                playerObj.queue.dequeue();
                playerObj.loop = true;
                let res = playerObj.next();
                expect(res).toBeFalsy();
            });

            it('end', function () {
                playerObj.stop = jest.fn();
                playerObj.queue.dequeue();
                let res = playerObj.next();
                expect(res).toBeFalsy();
            });
        });

        describe('stop', function () {
            it('normal', function () {
                playerObj.disconnect = jest.fn();
                let res = playerObj.stop();
                jest.runAllTimers();
                expect(res).toBe(errorCode.OK);
            });

            it('fail', function () {
                mockStopRet = false;
                let res = playerObj.stop();
                expect(res).toBe(errorCode.NOT_PLAYING);
            });
        });

        describe('enqueue', function () {
            it('normal', async function () {
                playerObj.prepareStream = jest.fn();

                playerObj.queue.dequeue();
                let res = await playerObj.enqueue(np);
                expect(res).toBe(1);
            });
        });

        describe('dequeue', function () {
            it('normal', function () {
                let res = playerObj.dequeue();
                expect(res).toBe(np);
                expect(playerObj.queue.getLength()).toBe(0);
            });
        });

        describe('peek', function () {
            it('normal', function () {
                let res = playerObj.peek();
                expect(res).toBe(np);
            });
        });

        describe('dispatch', function () {
            it('normal', async function () {
                playerObj.prepareStream = jest.fn(() => {
                    return playerObj.stream;
                });
                let res = await playerObj.dispatch();
                expect(res).toBe(errorCode.OK);
            });

            // it('stream error', async function () {
            //     playerObj.stream.errorCode = 1;
            //     let res = await playerObj.dispatch();
            //     expect(res).toBe(errorCode.ERROR);
            // });

            it('stream ended', async function () {
                playerObj.stream.ended = true;
                let res = await playerObj.dispatch();
                expect(res).toBe(errorCode.OK);
            });

            it('no stream', async function () {
                playerObj.stream = null;
                let res = await playerObj.dispatch();
                expect(res).toBe(errorCode.NOT_PLAYING);
            });
        });

        describe('setVolume', function () {
            it('normal', function () {
                playerObj.setVolume(1);
                expect(playerObj.stream.volume.setVolume).toHaveBeenCalledTimes(1);
            });
        });

        describe('skip', function () {
            beforeEach(() => {
                playerObj.next = jest.fn();
            });

            it('normal', function () {
                playerObj.dispatcher.state.status = AudioPlayerStatus.Playing;
                let res = playerObj.skip();
                expect(res).toBeTruthy();
            });

            it('with loop', function () {
                playerObj.dispatcher.state.status = AudioPlayerStatus.Playing;
                playerObj.loop = true;
                let res = playerObj.skip();
                expect(res).toBeTruthy();
                expect(playerObj.queue.getLength()).toBe(0);
            });

            it('nothing playing', function () {
                let res = playerObj.skip();
                expect(res).toBeFalsy();
            });
        });

        describe('pause', function () {
            it('normal', function () {
                playerObj.dispatcher.state.status = AudioPlayerStatus.Playing;
                let res = playerObj.pause();
                expect(res).toBe(errorCode.OK);
            });

            it('pause fail', function () {
                mockPauseRet = false;
                let res = playerObj.pause();
                expect(res).toBe(errorCode.NOT_PLAYING);
            });

            it('already paused', function () {
                playerObj.dispatcher.state.status = AudioPlayerStatus.Paused;
                let res = playerObj.pause();
                expect(res).toBe(errorCode.ALREADY_PAUSED);
            });
        });

        describe('resume', function () {
            it('normal', function () {
                let res = playerObj.resume();
                expect(res).toBe(errorCode.OK);
            });

            it('unpause fail', function () {
                mockUnpauseRet = false;
                let res = playerObj.resume();
                expect(res).toBe(errorCode.NOT_PLAYING);
            });

            it('already playing', function () {
                playerObj.dispatcher.state.status = AudioPlayerStatus.Playing;
                let res = playerObj.resume();
                expect(res).toBe(errorCode.ALREADY_PLAYING);
            });
        });

        describe('prepare stream', function () {
            it('normal', async function () {
                let res = await playerObj.prepareStream(np);
                expect(res).toBeTruthy();
            });

            it('no url', async function () {
                let res = await playerObj.prepareStream({});
                expect(res).toBeFalsy();
            });
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
                expect(await res).toBe(null);
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
                let res = playerObj.createStream(videoURL);
                await expect(res).rejects.toHaveProperty('errorCode', errorCode.ERROR);
            });

            it('playStream error, age verification', async function () {
                mockPlayThrowErr = true;
                mockPlayErr.message = 'Sign in to confirm your age';
                let res = playerObj.createStream(videoURL);
                await expect(res).rejects.toHaveProperty('errorCode', errorCode.CONFIRM_AGE);
            });

            it('playStream error, seek too long', async function () {
                mockPlayThrowErr = true;
                mockPlayErr.message = 'Seeking beyond limit';
                let res = playerObj.createStream(videoURL);
                await expect(res).rejects.toHaveProperty('errorCode', errorCode.SEEK_ERROR);
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
                expect(playerObj.queue.getLength()).toBe(0);
            });

            it('fail', function () {
                let res = playerObj.remove(0);
                expect(res).toBeFalsy();
            });
        });

        describe('seek', function () {
            beforeEach(() => {
                playerObj.dispatcher.state.status = AudioPlayerStatus.Playing;

                playerObj.dispatch = jest.fn(() => {
                    return errorCode.OK;
                });
                playerObj.createStream = jest.fn(() => {
                    return playerObj.stream;
                });
            });

            it('normal', async function () {
                let res = await playerObj.seek(seekTime);
                expect(res).toBe(errorCode.OK);
            });

            it('not playing', async function () {
                playerObj.dispatcher.state.status = AudioPlayerStatus.Idle;
                playerObj.nowPlaying = null;

                let res = await playerObj.seek(seekTime);
                expect(res).toBe(errorCode.NOT_PLAYING);
            });

            it('seek time too long', async function () {
                let res = await playerObj.seek(50);
                expect(res).toBe(errorCode.SEEK_ERROR);
            });

            it('seek edge case near track length', async function () {
                var once = true;
                playerObj.createStream = jest.fn(() => {
                    if (once) {
                        once = false;
                        throw {
                            errorCode: errorCode.SEEK_ERROR,
                            error: {
                                message: 'Seeking beyond limit. [ 0 - 30]',
                            },
                        };
                    } else {
                        return {};
                    }
                });

                let res = await playerObj.seek(seekTime);
                expect(res).toBe(errorCode.SEEK_ERROR);
            });

            it('seek error', async function () {
                playerObj.createStream = jest.fn(() => {
                    return {
                        errorCode: errorCode.ERROR,
                    };
                });

                playerObj.dispatch = jest.fn(() => {
                    return errorCode.SEEK_ERROR;
                });

                let res = await playerObj.seek(seekTime);
                expect(res).toBe(errorCode.SEEK_ERROR);
            });
        });

        describe('connect', function () {
            beforeEach(() => {
                playerObj.next = jest.fn();
                playerObj.stop = jest.fn();
                playerObj.playLoop = jest.fn();
            });

            it('normal', async function () {
                playerObj.dispatcher = null;
                await playerObj.connect(channel);
                expect(mockConn.subscribe).toHaveBeenCalledTimes(1);
            });

            it('fail', async function () {
                let res = playerObj.connect(channel);
                mockAudioPlayer.emit('error');
                await res;
                expect(mockConn.subscribe).toHaveBeenCalledTimes(0);
            });

            it('idle', async function () {
                let res = playerObj.connect(channel);
                mockAudioPlayer.emit(AudioPlayerStatus.Idle);
                await res;
                expect(mockConn.subscribe).toHaveBeenCalledTimes(0);
            });

            it('idle with loop', async function () {
                playerObj.loop = true;
                let res = playerObj.connect(channel);
                mockAudioPlayer.emit(AudioPlayerStatus.Idle);
                await res;
                expect(mockConn.subscribe).toHaveBeenCalledTimes(0);
            });

            it('conn error', async function () {
                playerObj.dispatcher.state.status = AudioPlayerStatus.Paused;

                let res = playerObj.connect(channel);
                mockConn.emit('error');
                await res;
                expect(mockConn.subscribe).toBeCalled();
            });

            it('conn error autopaused', async function () {
                playerObj.dispatcher.state.status = AudioPlayerStatus.AutoPaused;

                let res = playerObj.connect(channel);
                mockConn.emit('error');
                await res;
                expect(mockConn.subscribe).toBeCalled();
            });

            it('conn stateChange', async function () {
                playerObj.dispatcher.state.status = AudioPlayerStatus.AutoPaused;

                let res = playerObj.connect(channel);
                mockConn.emit('stateChange', {status:VoiceConnectionStatus.Ready}, {status:VoiceConnectionStatus.Connecting});
                await res;
                expect(mockConn.subscribe).toBeCalled();
            });
        });

        describe('disconnect', function () {
            it('normal', function () {
                let res = playerObj.disconnect();
                expect(res).toBe(errorCode.OK);
                expect(playerObj.queue.getLength()).toBe(0);
            });

            it('fail', function () {
                playerObj.conn = null;
                let res = playerObj.disconnect();
                expect(res).toBe(errorCode.ERROR);
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
                playerObj.dispatcher.state.status = AudioPlayerStatus.Playing;
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

        describe('getQueueElem', function () {
            it('normal', function () {
                let queueItem = playerObj.getQueueElem(0);
                expect(queueItem).toBe(playerObj.queue.get(0));
            });
        });
    });
});