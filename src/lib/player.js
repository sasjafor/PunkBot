import { AudioPlayerStatus,
         createAudioPlayer,
         createAudioResource,
         joinVoiceChannel, 
         NoSubscriberBehavior,
} from '@discordjs/voice';
import Debug from 'debug';
import got from 'got';
import moment from 'moment';
import playdl from 'play-dl';
import prism from 'prism-media';

import { Queue } from './queue.js';

const debug = Debug('punk_bot');
const debugv = Debug('punk_bot:verbose');
const debugd = Debug('punk_bot:debug');

// var ytdl_opts = [];

// var playback_opts = {
//     highWaterMark: 12,
//     passes: 4,
//     bitrate: 128,
//     fec: true,
// };

class Player {
    constructor() {
        this.queue = new Queue();
        this.nowPlaying = null;
        this.stream = null;
        this.loop = false;
        this.dispatcher = null;
        this.playing = false;
        this.timeout = null;
        this.conn = null;
        this.lastSeekTime = 0;
        this.subscription = null;
        this.volume = 1;
    }

    play() {
        this.playing = true;
        
        clearTimeout(this.timeout);
        let url = '';
        if (!this.loop || !this.nowPlaying) {
            this.nowPlaying = this.dequeue();
        }
        url = this.nowPlaying.url;

        if (this.nowPlaying.stream) {
            debugv('Using already prepared stream');

            this.stream = this.nowPlaying.stream;
        } else {
            this.stream = this.prepareStream(this.nowPlaying);
        }

        let next = this.peek();
        if (next) {
            next.stream = this.prepareStream(next);
        }

        let dispatchResult = null;
        if (this.stream) {
            if (this.conn) {
                debugd('Playing: ' + url);
                dispatchResult = this.dispatch();
            }
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
        this.dispatcher.stop();
        this.playing = false;
        var context = this;
        this.timeout = setTimeout(function() {
            context.disconnect();
        }, 300000);

        return;
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
        if (!this.stream) {
            return -1;
        }

        if (this.stream.started) {
            this.stream = this.prepareStream(this.nowPlaying);
            this.stream = await this.stream;
        }

        // set volume before playing
        this.stream.volume.setVolume(this.volume);
        this.dispatcher.play(this.stream);
    }

    /**
     * @param {number} value
     */
    setVolume(value) {
        this.volume = value;
        if (this.stream) {
            this.stream.volume.setVolume(value);
            debugv('Set volume to ' + value);
        }
    }

    skip() {
        if (this.playing) {
            let title = this.nowPlaying.title;
            if (this.loop) {
                this.nowPlaying = this.queue.dequeue();
            }
            this.next();
            return title;
        } else {
            return false;
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
    async createStream(url, seektime=null) {
        let stream = null;
        let fileNameRegex = /\/([\w\-. ]+)\.[\w\- ]+$/;
        if (fileNameRegex.test(url)) {
            if (!seektime) {
                seektime = '0';
            }
            let ffmpeg = new prism.FFmpeg({
                args: [
                    '-ss', String(seektime),
                    '-i', '-',
                    '-acodec', 'libopus', 
                    '-f', 'opus', 
                    '-ar', '48000', 
                    '-ac', '2',
                ],
            });

            stream = await got.stream(url);

            stream = await stream.pipe(ffmpeg);
        } else {
            try {
                stream = await playdl.stream(url, { discordPlayerCompatibility : true });
            } catch(error) {
                console.trace(error.name + ': ' + error.message);
                this.skip();
                return false;
            }
            stream = stream.stream;

            stream.on('error', error => {
                debug(url);
                console.trace(error.name + ': ' + error.message);
                if (error.message.includes('This video is not available.')) {
                    this.skip();
                } else {
                    // context.retry_on_403(url);
                }
            });

            if (!seektime) {
                seektime = '0';
            }
            stream = stream.pipe(new prism.FFmpeg({
                args: [
                    '-ss', String(seektime),
                    '-i', '-',
                    '-loglevel', '0', 
                    '-acodec', 'libopus', 
                    '-f', 'opus', 
                    '-ar', '48000', 
                    '-ac', '2',
                ],
            }));
        }

        if (stream.readable) {
            let resource = createAudioResource(stream, { inlineVolume: true });
            return resource;
        } else {
            debug('Encountered error with stream');
            setTimeout(function() {}, 1000);
            return await this.createStream(url);
        }
    }

    // this.retry_on_403 = function(url) {
    //
    // };

    clear() {
        this.queue = new Queue();
    }

    /**
     * @param {number} num
     */
    remove(num) {
        if(!this.conn) {
            return -1;
        }
        if (num > 0 && num <= this.queue.getLength()) {
            return this.queue.remove(num - 1)[0];
        } else {
            return false;
        }
    }

    async seek(time) {
        if (this.playing) {
            if (time > this.nowPlaying.duration.asSeconds()) {
                return 1;
            }
            debugd('Seek_time=' + time);
            // this.dispatcher.streamOptions.seek = time;
            // var opts = {
            //     ...playback_opts
            // };
            // opts.seek = time;
            this.lastSeekTime = time * 1000;
            this.stream = await this.createStream(this.nowPlaying.url, time);
            await this.dispatch();
            return 0;
        } else {
            return 2;
        }
    }

    async connect(channel) {
        if (channel) {
            // this.conn = await channel.join();
            this.conn = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
            var context = this;
            this.conn.on('error', error => {
                console.trace(error.name + ': ' + error.message);
                if (context.playing) {
                    context.connect();
                }
            });
            debug('Joined Voice Channel');

            this.dispatcher = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause,
                },
            });

            this.dispatcher.on(AudioPlayerStatus.Idle, () => {
                debugv('Finished playing');
                if (!this.loop) {
                    this.nowPlaying = null;
                }
                this.next();
            });
            this.dispatcher.on('error', error => {
                console.trace(error.name + ': ' + error.message);
                this.stop();
            });

            this.subscription = this.conn.subscribe(this.dispatcher);
        }
    }

    disconnect() {
        if (this.conn) {
            if (this.dispatcher) {
                // this.dispatcher.removeAllListeners();
                this.dispatcher.stop();
                // this.dispatcher = null;
            }
            this.conn.destroy();
            this.conn = null;
            this.queue = new Queue();
            this.playing = false;
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
