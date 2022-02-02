const ytdl = require('ytdl-core');
const ytdl_full = require('youtube-dl-exec');
const moment = require('moment');
const EventEmitter = require('events');
const {Queue} = require('./queue.js');
const Debug = require('debug');
const { joinVoiceChannel, 
        createAudioPlayer,
        createAudioResource,
} = require('@discordjs/voice');
const debug = Debug('punk_bot');
const debugv = Debug('punk_bot:verbose');
const debugd = Debug('punk_bot:debug');

var ytdl_opts = [];

// var playback_opts = {
//     highWaterMark: 12,
//     passes: 4,
//     bitrate: 128,
//     fec: true,
// };

function Player(channelId) {
    this.controller = new EventEmitter();
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

    this.controller.on('play', async () => {
        clearTimeout(this.timeout);
        var url = '';
        if (!this.loop || !this.now_playing) {
            this.now_playing = this.dequeue();
        }
        this.now_playing = await this.now_playing;
        url = this.now_playing.url;

        if (!url) {
            return;
        }
        this.stream = this.create_stream(url);
        if (!this.stream) {
            setTimeout(function() {
                this.stream = this.create_stream(url);
            }, 1000);
        }

        if (this.stream && this.conn) {
            debugd('Playing: ' + url);

            this.dispatch();
        }
    });

    this.controller.on('end', () => {
        // this.dispatcher = null;
        this.last_seek_time = 0;
        if (!this.queue.isEmpty() || (this.loop && this.now_playing)) {
            this.controller.emit('play');
        } else {
            this.playing = false;
            var context = this;
            this.timeout = setTimeout(function() {
                context.disconnect();
            }, 300000);
        }
    });

    this.play = function() {
        if (this.playing) {
            return;
        }
        this.playing = true;
        this.controller.emit('play');
    };

    this.enqueue = function(url) {
        this.queue.enqueue(url);
    };

    this.dequeue = function() {
        return this.queue.dequeue();
    };

    this.dispatch = function() {
        // if (this.dispatcher) {
        //     this.dispatcher.removeAllListeners();
        //     this.dispatcher.stop();
        //     this.dispatcher = null;
        // }
        // this.dispatcher = this.conn.play(this.stream, opts);
        this.dispatcher.play(this.stream);

        this.dispatcher.on('finish', () => {
            if (!this.loop) {
                this.now_playing = null;
            }
            this.controller.emit('end');
        });
        this.dispatcher.on('error', error => {
            debug(error);
            this.controller.emit('end');
        });
    };

    this.setVolume = function(value) {
        this.volume = value;
        if (this.stream) {
            this.stream.volume.setVolume(value);
            debugv("Set volume to " + value);
        }
    };

    this.skip = function() {
        if (this.playing) {
            if (this.loop) {
                this.now_playing = this.queue.dequeue();
            }
            // this.dispatcher.removeAllListeners();
            // this.dispatcher.stop();
            // this.dispatcher = null;
            this.controller.emit('end');
            return true;
        } else {
            return false;
        }
    };

    this.create_stream = function(url) {
        var stream = null;
        // this is most likely unsafe, but it works for now
        if (url.slice(-4, -3) == '.') {
            stream = url;
        } else if (url.startsWith('https://www.youtube.com') || url.startsWith('https://youtu.be')) {
            let opts = {
                // highWaterMark: 1 << 26
                quality: 'highestaudio',
                filter: 'audioonly',
            };
            stream = ytdl(url, opts);
            let context = this;
            stream.on('error', err => {
                debug(url);
                debug(err);
                if (err.message.includes('This video is not available.')) {
                    context.skip();
                } else {
                    // context.retry_on_403(url);
                }
            });
        } else {
            stream = ytdl_full(url, ytdl_opts);
            stream.on('error', err => {
                debug(err);
            });
            stream.on('info', info => {
                this.now_playing.title = info._filename;
                this.now_playing.duration = moment.duration(info._duration_hms);
            })
        }
        if (stream === url || stream.readable) {
            resource = createAudioResource(stream, { inlineVolume: true });
            resource.volume.setVolume(this.volume);
            return resource;
        } else {
            debug('Encountered error with stream');
            setTimeout(function() {}, 1000);
            return this.create_stream(url);
        }
    };

    // this.retry_on_403 = function(url) {
    //
    // };

    this.clear = function() {
        this.queue = new Queue();
    };

    this.remove = function(num) {
        if (num > 0 && num <= this.queue.getLength()) {
            return this.queue.remove(num - 1)[0];
        } else {
            return false;
        }
    };

    this.seek = function(time) {
        if (this.playing) {
            if (time > this.now_playing.duration.asSeconds()) {
                return 1;
            }
            debugd('Seek_time=' + time);
            // this.dispatcher.streamOptions.seek = time;
            var opts = {
                ...playback_opts
            };
            opts.seek = time;
            this.last_seek_time = time * 1000;
            this.stream = this.create_stream(this.now_playing.url);
            this.dispatch(opts);
            return 0;
        } else {
            return 2;
        }
    };

    this.connect = async function(channel) {
        if (channel) {
            // this.conn = await channel.join();
            this.conn = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
            var context = this;
            this.conn.on('failed', err => {
                debug(err);
                context.connect();
            });
            this.conn.on('disconnect', () => {
                if (context.playing) {
                    context.connect();
                }
            });
            this.conn.on('error', err => {
                debug(err);
                if (context.playing) {
                    context.connect();
                }
            });
            this.conn.on('warning', err => {
                debug(err);
            });
            debug('Joined Voice Channel');

            this.dispatcher = createAudioPlayer();
            this.subscription = this.conn.subscribe(this.dispatcher);
        }
    };

    this.disconnect = function() {
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
        }
    };

    this.shuffle = function() {
        this.queue.shuffle();
    };

    this.current_playback_progress = function() {
        if (this.dispatcher) {
            return this.dispatcher.streamTime + this.last_seek_time;
        } else {
            return false;
        }
    };

    this.getTotalRemainingPlaybackTime = async function() {
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
    };

    this.getTotalQueueTime = async function() {
        let duration = moment.duration(0);
        for (let i of this.queue.queue) {
            i = await i;
            duration.add(i.duration);
        }
        return duration;
    };

    this.getNowPlaying = function() {
        return this.now_playing;
    };

    this.getProgress = function() {
        if (this.dispatcher) {
            return moment.duration(this.current_playback_progress());
        } else {
            return false;
        }
    };

    this.getQueueLength = function() {
        return this.queue.getLength();
    };

    /* Returns the queue array, this is meant for read-only purposes and thus
     * avoids creating an unnecessary copy of the entire array
     */
    this.getQueue = function() {
        return this.queue;
    };
}

module.exports = {
    Player,
}
