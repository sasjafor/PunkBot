import {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    NoSubscriberBehavior,
    StreamType,
} from '@discordjs/voice';
import got from 'got';
import moment from 'moment';
import playdl from 'play-dl';
import prism from 'prism-media';

import { logger } from './../lib/log.js';
import { Queue } from './queue.js';

const DISCONNECT_TIMEOUT = 300000; // 5 minutes timeout

class Player {
    constructor() {
        this.queue = new Queue();
        this.nowPlaying = null;
        this.stream = null;
        this.oldStream = null;
        this.loop = false;
        this.dispatcher = null;
        this.timeout = null;
        this.conn = null;
        this.lastSeekTime = 0;
        this.subscription = null;
        this.volume = 1;
    }

    play() {
        clearTimeout(this.timeout);
        this.lastSeekTime = 0;
        let url = '';
        if (!this.loop || !this.nowPlaying) {
            this.nowPlaying = this.dequeue();
        }
        url = this.nowPlaying.url;

        if (this.nowPlaying.stream) {
            logger.debug('Using already prepared stream');

            this.stream = this.nowPlaying.stream;
        } else {
            this.stream = this.prepareStream(this.nowPlaying);
        }

        let next = this.peek();
        if (next) {
            next.stream = this.prepareStream(next);
        }

        let dispatchResult = null;
        if (this.conn) {
            logger.debug('Playing: ' + url);
            dispatchResult = this.dispatch();
        }

        return dispatchResult;
    }

    next() {
        if (!this.queue.isEmpty() || (this.loop && this.nowPlaying)) {
            this.play();
        } else {
            this.stop();
        }
    }

    stop() {
        this.dispatcher.unpause();
        let stop = this.dispatcher.stop();
        if (stop) {
            this.nowPlaying = null;
            var context = this;
            this.timeout = setTimeout(function () {
                context.disconnect();
            }, DISCONNECT_TIMEOUT);

            return 0;
        } else {
            return 1;
        }
    }

    enqueue(item) {
        if (this.queue.isEmpty()) {
            item.stream = this.prepareStream(item);
        }
        this.queue.enqueue(item);
    }

    dequeue() {
        return this.queue.dequeue();
    }

    peek() {
        return this.queue.peek();
    }

    async dispatch() {
        this.stream = await this.stream;
        if (this.stream.errorCode) {
            return this.stream.errorCode;
        }

        if (this.stream.started) {
            this.stream = this.prepareStream(this.nowPlaying);
            this.stream = await this.stream;
        }

        // set volume before playing
        this.stream.volume.setVolume(this.volume);
        this.oldStream?.playStream?.destroy();
        this.dispatcher.play(this.stream);
    }

    /**
     * @param {number} value
     */
    setVolume(value) {
        this.volume = value;
        if (!this.stream.errorCode) {
            this.stream.volume.setVolume(value);
            logger.debug('Set volume to ' + value);
        }
    }

    skip() {
        if (this.dispatcher.state.status === AudioPlayerStatus.Playing) {
            let title = this.nowPlaying.title;
            if (this.loop) {
                this.nowPlaying = this.queue.dequeue();
            }
            this.stream?.playStream?.destroy();
            this.next();
            return title;
        } else {
            return false;
        }
    }

    pause() {
        if (this.dispatcher.state.status === AudioPlayerStatus.Paused) {
            return 2;
        }
        let pause = this.dispatcher.pause(true);
        if (pause) {
            return 0;
        } else {
            return 1;
        }
    }

    resume() {
        if (this.dispatcher.state.status === AudioPlayerStatus.Playing) {
            return 2;
        }
        let unpause = this.dispatcher.unpause();
        if (unpause) {
            return 0;
        } else {
            return 1;
        }
    }

    async prepareStream(next) {
        let url = next.url;

        if (!url) {
            return;
        }
        let stream = await this.createStream(url);

        return stream;
    }

    /**
     * @param {string} url
     */
    async createStream(url, seektime = null) {
        if (!seektime) {
            seektime = 0;
        }
        let stream = null;
        let type = null;
        let fileNameRegex = /\/([\w\-. ]+)\.[\w\- ]+$/;
        if (fileNameRegex.test(url)) {
            type = StreamType.OggOpus;

            let ffmpeg = new prism.FFmpeg({
                args: [
                    '-i', '-',
                    '-ss', String(seektime),
                    '-loglevel', '0',
                    '-acodec', 'libopus',
                    '-f', 'opus',
                    '-ar', '48000',
                    '-ac', '2',
                ],
            });

            stream = await got.stream(url);

            stream = stream.pipe(ffmpeg);
        } else {
            let playStream;
            try {
                playStream = await playdl.stream(url, { seek: seektime });
            } catch (error) {
                let errorCode = 1;
                if (error.message.includes('Sign in to confirm your age')) {
                    errorCode = 2;
                    error.stack = null;
                    logger.warn(error);
                } else if (error.message.includes('Seeking beyond limit')) {
                    errorCode = 3;
                    error.stack = null;
                    logger.warn(error);
                } else {
                    logger.error(error);
                    this.skip();
                }
                return {
                    errorCode: errorCode,
                    error: error,
                };
            }
            type = playStream.type;
            stream = playStream.stream;
        }

        stream.on('error', error => {
            if (error.message.includes('This video is not available.')) {
                this.skip();
            } else if (error.message.includes('Premature close')) {
                logger.debug('Known error "premature close occured"');
            } else {
                logger.error(error);
            }
        });

        if (stream.readable) {
            let resource = createAudioResource(stream, { inlineVolume: true, inputType: type });
            return resource;
        } else {
            logger.error('Encountered error with stream');
            setTimeout(function () { }, 1000);
            return await this.createStream(url);
        }
    }

    clear() {
        this.queue = new Queue();
    }

    /**
     * @param {number} num
     */
    remove(num) {
        if (num > 0 && num <= this.queue.getLength()) {
            return this.queue.remove(num - 1)[0];
        } else {
            return false;
        }
    }

    async seek(time) {
        if (this.dispatcher.state.status === AudioPlayerStatus.Playing) {
            if (time > this.nowPlaying.duration.asSeconds()) {
                return 3;
            }
            logger.debug('Seek_time=' + time);
            this.oldStream = this.stream;
            this.stream = await this.createStream(this.nowPlaying.url, time);
            if (this.stream.errorCode) {
                let retErr = true;
                if (this.stream.errorCode === 3) {
                    let maxTimeRegex = /Seeking beyond limit. \[ [0-9]+ - ([0-9]+)]/;
                    let errorMsg = this.stream.error.message;
                    let match = errorMsg.match(maxTimeRegex);
                    if (match && match.length > 1) {
                        time = match[1];
                        this.stream = await this.createStream(this.nowPlaying.url, time);
                        if (!this.stream.errorCode) {
                            retErr = false;
                        }
                    }
                }
                if (retErr) {
                    return this.stream.errorCode;
                }
            }
            this.lastSeekTime = time * 1000;
            await this.dispatch();
            return 0;
        } else {
            return 2;
        }
    }

    async connect(channel) {
        if (channel) {
            this.conn = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
            var context = this;
            this.conn.on('error', error => {
                logger.error(error);
                if (context.dispatcher.state.status === AudioPlayerStatus.Paused ||
                    context.dispatcher.state.status === AudioPlayerStatus.AutoPaused) {
                    context.connect();
                }
            });
            logger.info('Joined Voice Channel');

            if (!this.dispatcher) {
                this.dispatcher = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Pause,
                    },
                });

                this.dispatcher.on(AudioPlayerStatus.Idle, () => {
                    logger.debug('Finished playing');
                    if (!this.loop) {
                        this.nowPlaying = null;
                    }
                    this.next();
                });
                this.dispatcher.on('error', error => {
                    logger.error(error);
                    this.stop();
                });

                this.subscription = this.conn.subscribe(this.dispatcher);
            }
        }
    }

    disconnect() {
        if (this.conn) {
            if (this.dispatcher) {
                this.dispatcher.removeAllListeners();
                this.dispatcher.stop();
            }
            this.conn.destroy();
            this.conn = null;
            this.queue = new Queue();
            this.dispatcher = null;
            this.nowPlaying = null;
            this.stream = null;
            this.lastSeekTime = 0;

            return true;
        } else {
            return false;
        }
    }

    shuffle() {
        this.queue.shuffle();
    }

    currentPlaybackProgress() {
        if (this.dispatcher) {
            return this.stream.playbackDuration + this.lastSeekTime;
        } else {
            return false;
        }
    }

    async getTotalRemainingPlaybackTime() {
        let duration = moment.duration(0);
        for (let i of this.queue.queue) {
            i = await i;
            duration.add(i.duration);
        }
        if (this.nowPlaying && this.dispatcher) {
            duration.add(this.nowPlaying.duration)
                .subtract(this.currentPlaybackProgress(), 'ms');
        }
        return duration;
    }

    async getTotalQueueTime() {
        let duration = moment.duration(0);
        for (let i of this.queue.queue) {
            i = await i;
            duration.add(i.duration);
        }
        return duration;
    }

    getNowPlaying() {
        return this.nowPlaying;
    }

    getProgress() {
        if (this.dispatcher) {
            return moment.duration(this.currentPlaybackProgress());
        } else {
            return false;
        }
    }

    getQueueLength() {
        return this.queue.getLength();
    }

    /* Returns the queue array, this is meant for read-only purposes and thus
     * avoids creating an unnecessary copy of the entire array
     */
    getQueue() {
        return this.queue;
    }
}

export {
    Player,
};
