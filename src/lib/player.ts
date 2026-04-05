import {
    AudioPlayer,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    NoSubscriberBehavior,
    PlayerSubscription,
    StreamType,
    VoiceConnection,
    VoiceConnectionStatus,
} from '@discordjs/voice';
import got from 'got';
import moment from 'moment';
import prism from 'prism-media';
// import ytdl from '@distube/ytdl-core';

// import { Readable } from 'stream';

import { ErrorCode, CreateStreamError } from './errors.js';
import { exec } from 'child_process';
import { logger } from './log.js';
import { PlaybackItem } from './playbackItem.js';
import { Queue } from './queue.js';
import { VoiceBasedChannel } from 'discord.js';
import { strings } from './messageStrings.js';
import { getYTStreamUrl } from './util.js';

const DISCONNECT_TIMEOUT = 300000; // 5 minutes timeout

class Player {
    private queue: Queue<PlaybackItem>;
    private nowPlaying: PlaybackItem | null;
    private stream: AudioResource | null;
    private oldStream: AudioResource | null;
    private loop: boolean;
    private dispatcher: AudioPlayer | null;
    private timeout: ReturnType<typeof setTimeout> | null;
    private conn: VoiceConnection | null;
    private lastSeekTime: number;
    private subscription: PlayerSubscription | null;
    private volume: number;
    private channel: VoiceBasedChannel | null;
    private filters: string;
    // private yt: Innertube | null;

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
        this.channel = null;
        this.filters = '';
        // this.yt = null;
    }

    //#region Main Commands

    // public async init(): Promise<void> {
    //     if (this.yt === null) {
    //         this.yt = await Innertube.create({ cache: new UniversalCache(false), generate_session_locally: true });
    //     }
    // }

    public clear(): void {
        this.queue = new Queue();
    }

    public disconnect(): number {
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

            return ErrorCode.OK;
        } else {
            return ErrorCode.ERROR;
        }
    }

    public switchLoop(): boolean {
        this.loop = !this.loop;
        return this.loop;
    }

    public getNowPlaying(): PlaybackItem | null {
        return this.nowPlaying;
    }

    public getProgress(): moment.Duration | null {
        if (this.dispatcher && this.dispatcher.state.status !== AudioPlayerStatus.Idle) {
            return moment.duration(this.currentPlaybackProgress());
        } else {
            return null;
        }
    }

    public getQueueLength(): number {
        return this.queue.getLength();
    }

    public pause(): number {
        if (this.dispatcher?.state.status === AudioPlayerStatus.Paused) {
            return ErrorCode.ALREADY_PAUSED;
        }
        const pause = this.dispatcher?.pause(true);
        if (pause) {
            return ErrorCode.OK;
        } else {
            return ErrorCode.NOT_PLAYING;
        }
    }

    public connect(channel: VoiceBasedChannel): void {
        if (channel) {
            this.channel = channel;
            this.conn = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
            this.conn.on('error', error => {
                logger.error(error);
                if (this.dispatcher?.state.status === AudioPlayerStatus.Paused ||
                    this.dispatcher?.state.status === AudioPlayerStatus.AutoPaused) {
                    this.forceReconnect();
                }
            });
            this.conn.on('stateChange', (oldState, newState) => {
                // this shouldn't happen if the connection is stable
                if (oldState.status === VoiceConnectionStatus.Ready && newState.status === VoiceConnectionStatus.Connecting) {
                    logger.debug('Force Reconnect!!');
                    this.forceReconnect();
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
                        this.next();
                    } else {
                        this.playLoop();
                    }
                });
                this.dispatcher.on('error', error => {
                    logger.error(error);
                    this.stop();
                });

                const subscription = this.conn.subscribe(this.dispatcher);
                if (subscription !== undefined) {
                    this.subscription = subscription;
                }
            }
        }
    }

    public remove(index: number): PlaybackItem | null {
        if (index > 0 && index <= this.queue.getLength()) {
            return this.queue.remove(index - 1);
        } else {
            return null;
        }
    }

    public resume(): number {
        if (this.dispatcher?.state.status === AudioPlayerStatus.Playing) {
            return ErrorCode.ALREADY_PLAYING;
        }
        const unpause = this.dispatcher?.unpause();
        if (unpause) {
            return ErrorCode.OK;
        } else {
            return ErrorCode.NOT_PLAYING;
        }
    }

    public async seek(time: number): Promise<number> {
        if (this.nowPlaying?.url) {
            if (time > this.nowPlaying.duration.asSeconds()) {
                return ErrorCode.SEEK_ERROR;
            }
            logger.debug('Seek_time=' + time);
            this.oldStream = this.stream;
            try {
                this.stream = await this.createStream(this.nowPlaying.url, time);
            } catch (exception) {
                if (exception instanceof CreateStreamError) {
                    if (exception.errorCode) {
                        let retErr = true;
                        if (exception.errorCode === ErrorCode.SEEK_ERROR) {
                            const maxTimeRegex = /Seeking beyond limit. \[ [0-9]+ - ([0-9]+)]/;
                            const errorMsg = exception.message;
                            const match = errorMsg.match(maxTimeRegex);
                            if (match && match.length > 1) {
                                let time = Number(match[1]);
                                try {
                                    this.stream = await this.createStream(this.nowPlaying.url, time);
                                } catch (exception) {
                                    if (exception instanceof CreateStreamError) {
                                        if (!exception.errorCode) {
                                            retErr = false;
                                        }
                                    }
                                }
                            }
                        }
                        if (retErr) {
                            return exception.errorCode;
                        }
                    }
                }
            }

            this.nowPlaying.seekTime = time;
            return await this.dispatch();
        } else {
            return ErrorCode.NOT_PLAYING;
        }
    }

    public shuffle(): void {
        this.queue.shuffle();
    }

    public skip(): string | null {
        if (this.dispatcher?.state.status === AudioPlayerStatus.Playing ||
            this.dispatcher?.state?.status === AudioPlayerStatus.Paused
        ) {
            const title = this.nowPlaying?.title ?? null;
            if (this.loop) {
                this.nowPlaying = this.queue.dequeue();
            }
            this.next();
            return title;
        } else {
            return null;
        }
    }

    public stop(): number {
        this.dispatcher?.unpause();
        const stop = this.dispatcher?.stop();
        if (stop) {
            this.nowPlaying = null;
            this.timeout = setTimeout(() => {
                this.disconnect();
            }, DISCONNECT_TIMEOUT);

            return ErrorCode.OK;
        } else {
            return ErrorCode.NOT_PLAYING;
        }
    }

    public setVolume(value: number): void {
        this.volume = value;
        if (this.stream) {
            this.stream.volume?.setVolume(value);
            logger.debug('Set stream volume to ' + value);
        }
    }

    public async setFilters(filters: string): Promise<void> {
        this.filters = filters;

        if (this.nowPlaying?.url) {
            this.oldStream = this.stream;
            const currentTime = this.currentPlaybackProgress() / 1000;
            this.stream = await this.createStream(this.nowPlaying.url, currentTime);

            this.nowPlaying.seekTime = currentTime;
            await this.dispatch();
            return;
        } else {
            return;
        }
    }

    //#endregion

    /**
     *
     * @param item Item to add to the queue
     * @param doPlayNext Force play next
     * @returns Index of the enqueued item
     */
    public async enqueue(item: PlaybackItem, doPlayNext = false): Promise<number> {
        if (this.queue.isEmpty()) {
            item.stream = await this.prepareStream(item);
        }
        if (doPlayNext) {
            this.queue.addFirst(item);
            return 1;
        } else {
            return this.queue.enqueue(item);
        }
    }

    public async play(): Promise<void> {
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
        }
        this.lastSeekTime = 0;
        let url = '';
        if (!this.loop || !this.nowPlaying) {
            this.nowPlaying = this.dequeue();
        }
        if (this.nowPlaying === null) {
            logger.error('Nothing to play!');
            return;
        }

        url = this.nowPlaying.url;

        if (this.nowPlaying?.stream) {
            logger.debug('Using already prepared stream');

            this.stream = this.nowPlaying.stream;
        } else {
            this.stream = await this.prepareStream(this.nowPlaying);
        }

        const next = this.peek();
        if (next) {
            next.stream = await this.prepareStream(next);
        }

        if (this.conn) {
            const dispatchRes = await this.dispatch();
            if (dispatchRes === ErrorCode.OK) {
                logger.debug('Playing: ' + url);
            }
        }
    }

    private async playLoop(): Promise<void> {
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
        }
        this.lastSeekTime = 0;

        if (this.nowPlaying === null) {
            logger.error('Nothing to play!');
            return;
        }

        if (this.nowPlaying.stream) {
            logger.debug('Using already prepared stream');

            this.stream = this.nowPlaying.stream;
            this.nowPlaying.stream = await this.prepareStream(this.nowPlaying);
        } else {
            this.stream = await this.prepareStream(this.nowPlaying);
            this.nowPlaying.stream = this.stream;
        }

        if (this.stream === null) {
            logger.error('No stream to play!');
            return;
        }

        if (this.stream.ended) {
            this.stream = await this.prepareStream(this.nowPlaying);
        }

        if (this.stream === null) {
            logger.error('No stream to play!');
            return;
        }

        // set volume before playing
        this.stream.volume?.setVolume(this.volume);
        this.dispatcher?.play(this.stream);
    }

    public async getTotalRemainingPlaybackTime(): Promise<moment.Duration> {
        const duration = moment.duration(0);
        for (const i of this.queue) {
            duration.add(i.duration);
        }
        if (this.nowPlaying && this.dispatcher) {
            duration.add(this.nowPlaying.duration)
                .subtract(this.currentPlaybackProgress(), 'ms');
        }
        return duration;
    }

    public async getTotalQueueTime(): Promise<moment.Duration> {
        const duration = moment.duration(0);
        for (const i of this.queue) {
            duration.add(i.duration);
        }
        return duration;
    }

    public async getTimeUntil(index: number): Promise<moment.Duration> {
        const duration = moment.duration(0);
        for (let k = 0; k < this.queue.getLength() && k < index; k++) {
            const el = await this.queue.get(k);
            duration.add(el.duration);
        }
        if (this.nowPlaying && this.dispatcher) {
            duration.add(this.nowPlaying.duration)
                .subtract(this.currentPlaybackProgress(), 'ms');
        }
        return duration;
    }

    public getQueueElem(index: number): PlaybackItem {
        return this.queue.get(index);
    }

    public isConnected(): boolean {
        return this.conn !== null;
    }

    public isPlaying(): boolean {
        return this.dispatcher?.state?.status === AudioPlayerStatus.Playing;
    }

    public isPaused(): boolean {
        return this.dispatcher?.state?.status === AudioPlayerStatus.Paused;
    }

    public isIdle(): boolean {
        return this.dispatcher?.state?.status === AudioPlayerStatus.Idle;
    }

    public isLooping(): boolean {
        return this.loop;
    }

    //#region private

    private forceReconnect(): void {
        if (this.conn) {
            this.conn.removeAllListeners();
            if (!this.conn.disconnect()) {
                this.conn.destroy();
            }
        }
        if (!this.channel) {
            logger.warn('No channel to force reconnect to!');
            return;
        }

        this.connect(this.channel);
        if (this.dispatcher) {
            const sub = this.conn?.subscribe(this.dispatcher);
            if (sub !== undefined) {
                this.subscription = sub;
            }
        }
    }

    private currentPlaybackProgress(): number {
        if (this.dispatcher && this.stream) {
            return this.stream.playbackDuration + this.lastSeekTime;
        } else {
            return 0;
        }
    }

    private async prepareStream(next: PlaybackItem): Promise<AudioResource | null> {
        const url = next.url;
        const seektime = next.seekTime;

        if (!url) {
            return null;
        }
        try {
            return await this.createStream(url, seektime);
        } catch (exception) {
            return null;
        }
    }

    private async createStream(url: string, seektime: number | null = null): Promise<AudioResource | null> {
        if (!seektime) {
            seektime = 0;
        }
        let stream = null;
        let type = null;

        const ffmpegArgs = [
            '-i', '-',
            '-ss', String(seektime),
            '-loglevel', '0',
            '-acodec', 'libopus',
            '-f', 'opus',
            '-ar', '48000',
            '-ac', '2',
        ];
        if (this.filters.length > 0) {
            ffmpegArgs.push('-af');
            ffmpegArgs.push(this.filters);
        }

        const fileNameRegex = /\/([\w\-. ]+)\.[\w\- ]+$/;
        if (fileNameRegex.test(url)) {
            type = StreamType.OggOpus;

            const ffmpeg = new prism.FFmpeg({
                args: ffmpegArgs,
            });

            stream = await got.stream(url);

            stream = stream.pipe(ffmpeg);
        } else {
            try {
                let streamUrl = await getYTStreamUrl(url);

                // if (this.yt === null) {
                //     throw Error('youtubei is not initialised');
                // }
                // stream = await ytdl(url);

                // stream = await ytdl(url, {
                //     filter: 'audioonly',
                //     highWaterMark: 1 << 62,
                //     quality: 'highestaudio',
                // });

                // const navigationEndpoint = await this.yt.resolveURL(url);

                // const videoInfo = await this.yt.getInfo(navigationEndpoint);

                // stream = await this.yt.download(videoInfo.basic_info.id as string, {
                //     type: 'audio', // audio, video or video+audio
                //     quality: 'best', // best, bestefficiency, 144p, 240p, 480p, 720p and so on.
                //     format: 'opus', // media container format,
                //     client: 'YTMUSIC',
                // });


                stream = await got.stream(streamUrl);
                const ffmpeg = new prism.FFmpeg({
                    args: ffmpegArgs,
                });

                // stream = Readable.fromWeb(stream as ReadableStream);
                stream = stream.pipe(ffmpeg);
            } catch (error) {
                let errCode = ErrorCode.ERROR;
                let errMessage = strings.errorMsgNotAvailable;
                if (error instanceof Error) {
                    errMessage = error.message;
                    if (error.message.includes('Sign in to confirm your age')) {
                        errCode = ErrorCode.CONFIRM_AGE;
                        error.stack = undefined;
                        logger.warn(error);
                    } else if (error.message.includes('Seeking beyond limit')) {
                        errCode = ErrorCode.SEEK_ERROR;
                        error.stack = undefined;
                        logger.warn(error);
                    } else {
                        logger.error(error);
                        this.skip();
                    }
                }
                throw new CreateStreamError(errMessage, errCode);
            }
            type = StreamType.Opus;
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
            const resource = createAudioResource(stream, { inlineVolume: true });
            resource.volume?.setVolume(this.volume);
            return resource;
        } else {
            logger.error('Encountered error with stream');
            setTimeout(() => { }, 1000);
            try {
                return await this.createStream(url, seektime);
            } catch (exception) {
                return null;
            }
        }
    }

    private async dispatch(): Promise<number> {
        if (!this.stream) {
            return ErrorCode.NOT_PLAYING;
        }

        this.stream = await this.stream;

        if (!this.nowPlaying) {
            return ErrorCode.NOT_PLAYING;
        }

        if (this.stream?.ended) {
            this.stream = await this.prepareStream(this.nowPlaying);
        }

        if (!this.stream) {
            return ErrorCode.NOT_PLAYING;
        }

        // set volume before playing
        this.stream?.volume?.setVolume(this.volume);
        this.oldStream?.playStream?.destroy();
        this.lastSeekTime = 1000 * this.nowPlaying.seekTime;
        this.dispatcher?.play(this.stream);

        return ErrorCode.OK;
    }

    private next(): void {
        if (!this.queue.isEmpty() || (this.loop && this.nowPlaying)) {
            this.play();
        } else {
            this.stop();
        }
    }

    private dequeue(): PlaybackItem | null {
        return this.queue.dequeue();
    }

    private peek(): PlaybackItem | null {
        return this.queue.peek();
    }

    //#endregion
}

export {
    Player,
};
