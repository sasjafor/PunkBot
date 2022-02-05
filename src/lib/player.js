const { joinVoiceChannel, 
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
} = require('@discordjs/voice');
const Debug = require('debug');
const debug = Debug('punk_bot');
const debugv = Debug('punk_bot:verbose');
const debugd = Debug('punk_bot:debug');
const moment = require('moment');
const playdl = require('play-dl');
const prism = require('prism-media');
// const ytdl = require('ytdl-core');
// const ytdl_full = require('youtube-dl-exec');
// const EventEmitter = require('events');

const { Queue } = require('./queue.js');

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
        this.now_playing = null;
        this.stream = null;
        this.loop = false;
        this.dispatcher = null;
        this.playing = false;
        this.timeout = null;
        this.conn = null;
        this.last_seek_time = 0;
        this.subscription = null;
        this.volume = 1;
    }

    play() {
        // if (this.playing) {
        //     return;
        // }
        this.playing = true;
        
        clearTimeout(this.timeout);
        var url = '';
        if (!this.loop || !this.now_playing) {
            this.now_playing = this.dequeue();
        }

        if (this.now_playing.stream) {
            debugv('Using already prepared stream');

            this.stream = this.now_playing.stream;
        } else {
            this.stream = this.prepare_stream(this.now_playing);
        }

        let next = this.peek();
        if (next) {
            next.stream = this.prepare_stream(next);
        }

        if (this.stream && this.conn) {
            debugd('Playing: ' + url);

            this.dispatch();
        }
    }

    next() {
        if (!this.queue.isEmpty() || (this.loop && this.now_playing)) {
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
            item.stream = this.prepare_stream(item);
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
        // set volume before playing
        this.stream = await this.stream;
        if (!this.stream) {
            return;
        }

        if (this.stream.started) {
            this.stream = this.prepare_stream(this.now_playing);
            this.stream = await this.stream;
        }

        this.stream.volume.setVolume(this.volume);
        this.dispatcher.play(this.stream);
    }

    setVolume(value) {
        this.volume = value;
        if (this.stream) {
            this.stream.volume.setVolume(value);
            debugv('Set volume to ' + value);
        }
    }

    skip() {
        if (this.playing) {
            let title = this.now_playing.title;
            if (this.loop) {
                this.now_playing = this.queue.dequeue();
            }
            this.next();
            return title;
        } else {
            return false;
        }
    }

    async prepare_stream(next) {
        let url = next.url;

        if (!url) {
            return;
        }
        let stream = await this.create_stream(url);
        // if (!stream) {
        //     setTimeout(async function() {
        //         stream = await this.create_stream(url);
        //     }, 1000);
        // }

        return stream;
    }

    /**
     * @param {string} url
     */
    async create_stream(url, seektime=null) {
        var stream = null;
        // this is most likely unsafe, but it works for now
        if (url.slice(-4, -3) == '.') {
            stream = url;
        } else {
            try {
                stream = await playdl.stream(url, { discordPlayerCompatibility : true });
            } catch(err) {
                debug(err);
                this.skip();
                return false;
            }
            stream = stream.stream;

            stream.on('error', err => {
                debug(url);
                debug(err);
                if (err.message.includes('This video is not available.')) {
                    this.skip();
                } else {
                    // context.retry_on_403(url);
                }
            });

            if (seektime == null) {
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
                ]
            }));
            // console.log(stream);
        }
        // } else if (url.startsWith('https://www.youtube.com') || url.startsWith('https://youtu.be')) {
        //     let opts = {
        //         // highWaterMark: 1 << 26
        //         quality: 'highestaudio',
        //         filter: 'audioonly',
        //     };
        //     stream = ytdl(url, opts);
        //     let context = this;
        //     stream.on('error', err => {
        //         debug(url);
        //         debug(err);
        //         if (err.message.includes('This video is not available.')) {
        //             context.skip();
        //         } else {
        //             // context.retry_on_403(url);
        //         }
        //     });
        // } else {
        //     stream = ytdl_full(url, ytdl_opts);
        //     stream.on('error', err => {
        //         debug(err);
        //     });
        //     stream.on('info', info => {
        //         this.now_playing.title = info._filename;
        //         this.now_playing.duration = moment.duration(info._duration_hms);
        //     })
        // }
        if (stream === url || (stream instanceof prism.FFmpeg && stream.readable)) {
            let resource = createAudioResource(stream, { inlineVolume: true });
            return resource;
        } else {
            debug('Encountered error with stream');
            setTimeout(function() {}, 1000);
            return await this.create_stream(url);
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
            if (time > this.now_playing.duration.asSeconds()) {
                return 1;
            }
            debugd('Seek_time=' + time);
            // this.dispatcher.streamOptions.seek = time;
            // var opts = {
            //     ...playback_opts
            // };
            // opts.seek = time;
            this.last_seek_time = time * 1000;
            this.stream = await this.create_stream(this.now_playing.url, time);
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
            this.conn.on('error', err => {
                debug(err);
                if (context.playing) {
                    context.connect();
                }
            });
            debug('Joined Voice Channel');

            this.dispatcher = createAudioPlayer();

            this.dispatcher.on(AudioPlayerStatus.Idle, () => {
                debugv('Finished playing');
                if (!this.loop) {
                    this.now_playing = null;
                }
                this.next();
            });
            this.dispatcher.on('error', error => {
                debug(error);
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
            this.now_playing = null;
            this.stream = null;
            this.last_seek_time = 0;

            return true;
        } else {
            return false;
        }
    }

    shuffle() {
        this.queue.shuffle();
    }

    current_playback_progress() {
        if (this.dispatcher) {
            return this.stream.playbackDuration + this.last_seek_time;
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
        if (this.now_playing && this.dispatcher) {
            duration.add(this.now_playing.duration)
                .subtract(this.current_playback_progress(), 'ms');
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
        return this.now_playing;
    }

    getProgress() {
        if (this.dispatcher) {
            return moment.duration(this.current_playback_progress());
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

module.exports = {
    Player,
};
