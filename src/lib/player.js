const debug = require('debug')('basic');
const debugv = require('debug')('verbose');
const ytdl = require('ytdl-core');
const ytdl_full = require('youtube-dl');
const moment = require('moment');
const EventEmitter = require('events');
const {
    Queue
} = require('./queue.js');
// const {Controller} = require('./controller.js');


var ytdl_opts = [];

var playback_opts = {
    highWaterMark: 1
};

function Player(voice_channel_id, controller) {
    this.controller = new EventEmitter();
    this.queue = new Queue();
    this.now_playing = null;
    this.stream = null;
    this.loop = false;
    this.dispatcher = null;
    this.playing = false;
    this.timeout = null;

    this.voice_channel_id = voice_channel_id;
    this.conn = null;

    this.controller.on('play', () => {
        clearTimeout(this.timeout);
        var url = '';
        if (!this.loop || !this.now_playing) {
            this.now_playing = this.dequeue();
        }
        url = this.now_playing.url

        if (!url) {
            return;
        }
        this.stream = this.create_stream(url);

        if (this.stream && this.conn) {
            debugv('Playing: ' + url);
            // playback_opts.type = 'webm/opus'; // TODO: need to check if actually webm/opus stream

            this.dispatch(playback_opts);
        }
    });

    this.controller.on('end', () => {
        if (!this.queue.isEmpty() || (this.loop && this.now_playing)) {
            this.controller.emit('play');
        } else {
            this.playing = false;
            var context = this;
            this.timeout = setTimeout(function() {
                context.disconnect();
            }, 120000);
        }
    });

    this.play = function(channel) {
        if (this.playing) {
            return;
        }
        this.playing = true;
        this.controller.emit('play');
    }

    this.enqueue = function(url) {
        this.queue.enqueue(url);
    }

    this.dequeue = function() {
        return this.queue.dequeue();
    }

    this.dispatch = function(opts) {
        if (this.dispatcher) {
            this.dispatcher.destroy();
        }
        // debugv(this.stream);
        this.dispatcher = this.conn.play(this.stream, opts);
        this.dispatcher.on('finish', () => {
            if (!this.loop) {
                this.now_playing = null;
            }
            debugv('EMITTING END');
            this.controller.emit('end');
        });
        this.dispatcher.on('error', error => {
            debug(error);
            // this.controller.emit('end');
        });
    }

    this.pre_play = function(url) {
        // TODO: still necessary?
        this.now_playing = url;
        this.curr_stream = this.create_stream(url);
    }

    this.setVolume = function(value) {
        playback_opts.volume = value;
        this.dispatcher.setVolume(value);
    }

    this.skip = function() {
        if (this.playing) {
            if (this.loop) {
                this.now_playing = this.queue.dequeue();
            }
            this.dispatcher.end();
            return true;
        } else {
            return false;
        }
    }

    this.create_stream = function(url) {
        var stream = null;
        // this is most likely unsafe, but it works for now
        if (url.slice(-4, -3) == '.') {
            stream = url;
        } else if (url.startsWith('https://www.youtube.com') || url.startsWith('https://youtu.be')) {
            // let timestamp_regex = /(?:\?t=)([0-9]+)|(?:\&t=)([0-9]+)/;
            // let timestamp = 0
            // if (timestamp_regex.test(url)) {
            //     timestamp = parseInt(url.match(timestamp_regex)[1], 10) * 1000;
            // }
            // ytdl.getInfo(ytdl.getURLVideoID(url), (err, info) => {
            //     if (err) throw err;
            //     let format = ytdl.chooseFormat(info.formats, { quality: '249,250,251' });
            //     info.formats = format;
            //     stream = ytdl.downloadFromInfo(info);
            // });
            let opts = {
                // filter: format => {
                //     return format.type === 'audio/webm; codecs="opus"';
                // },
                // begin: timestamp
            }
            // debugv(opts);
            stream = ytdl(url, opts);
        } else {
            stream = ytdl_full(url, ytdl_opts);
        }
        return stream;
    }

    this.clear = function() {
        this.queue = new Queue();
    }

    this.seek = function(time) {
        if (this.playing) {
            if (time > this.now_playing.duration.asSeconds()) {
                return 1;
            }
            debugv('Seek_time=' + time);
            // this.dispatcher.streamOptions.seek = time;
            var opts = {};
            opts.seek = time;
            opts.highWaterMark = 1;
            this.stream = this.create_stream(this.now_playing.url);
            this.dispatch(opts);
            return 0;
        } else {
            return 2;
        }
    }

    this.connect = async function(channel) {
        if (channel) {
            try {
                this.conn = await channel.join();
                var context = this;
                this.conn.on('failed', err => {
                    debug(err);
                    context.connect();
                });
                this.conn.on('disconnect', () => {
                    if (context.playing) {
                        context.connect();
                        context.controller.emit('end');
                    }
                });
            } catch (err) {
                debug(err);
            }
            debug('Joined Voice Channel');
        }
    }

    this.disconnect = function() {
        if (this.conn) {
            this.conn.disconnect();
            this.conn = null;
            this.queue = new Queue();
            this.playing = false;
            this.dispatcher = null;
            this.now_playing = null;
            this.stream = null;
        }
    }

    this.total_queue_time = function() {
        let duration = moment.duration(0);
        let len = this.queue.getLength();
        for (let i = 0; i < len - 1; i++) {
            duration.add(this.queue.queue[i].duration);
        }
        duration.add(this.now_playing.duration).subtract(this.dispatcher.streamTime, 'ms');
        return duration;
    }

    this.getNowPlaying = function() {
        return this.now_playing;
    }

    this.getProgress = function() {
        return moment.duration(this.dispatcher.streamTime)
    }
}

module.exports.Player = Player;
