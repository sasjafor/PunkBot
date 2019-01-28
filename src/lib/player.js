const debug = require('debug')('basic');
const debugv = require('debug')('verbose');
const ytdl = require('ytdl-core');
const ytdl_full = require('youtube-dl');
const moment = require('moment');
const EventEmitter = require('events');
const {
    Queue
} = require('./queue.js');


var ytdl_opts = [];

var playback_opts = {
    highWaterMark: 1
};

function Player() {
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

    this.controller.on('play', () => {
        clearTimeout(this.timeout);
        var url = '';
        if (!this.loop || !this.now_playing) {
            this.now_playing = this.dequeue();
        }
        url = this.now_playing.url;

        if (!url) {
            return;
        }
        this.stream = this.create_stream(url);

        if (this.stream && this.conn) {
            debugv('Playing: ' + url);

            this.dispatch(playback_opts);
        }
    });

    this.controller.on('end', () => {
        this.dispatcher = null;
        this.last_seek_time = 0;
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

    this.dispatch = function(opts) {
        if (this.dispatcher) {
            this.dispatcher.removeAllListeners();
            this.dispatcher.destroy();
            this.dispatcher = null;
        }
        this.dispatcher = this.conn.play(this.stream, opts);
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
        playback_opts.volume = value;
        if (this.dispatcher) {
            this.dispatcher.setVolume(value);
        }
    };

    this.skip = function() {
        if (this.playing) {
            if (this.loop) {
                this.now_playing = this.queue.dequeue();
            }
            this.dispatcher.removeAllListeners();
            this.dispatcher.destroy();
            this.dispatcher = null;
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
                highWaterMark: 1<<26,
                debug: true
            };
            // debugv(opts);
            stream = ytdl(url, opts);
            stream.on('error', err => {
                debug(url);
                debug(err);
            });
        } else {
            stream = ytdl_full(url, ytdl_opts);
            stream.on('error', err => {
                debug(err);
            });
        }
        if (stream === url || stream.readable) {
            return stream;
        } else {
            debugv('403 ERROR!!');
            setTimeout(function() {}, 1000);
            return this.create_stream(url);
        }
    };

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
            debugv('Seek_time=' + time);
            // this.dispatcher.streamOptions.seek = time;
            var opts = {
                ...playback_opts
            };
            opts.seek = time;
            this.last_seek_time = time*1000;
            this.stream = this.create_stream(this.now_playing.url);
            this.dispatch(opts);
            return 0;
        } else {
            return 2;
        }
    };

    this.connect = async function(channel) {
        if (channel) {
            this.conn = await channel.join();
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
            debug('Joined Voice Channel');
        }
    };

    this.disconnect = function() {
        if (this.conn) {
            this.conn.disconnect();
            this.conn = null;
            this.queue = new Queue();
            this.playing = false;
            this.dispatcher = null;
            this.now_playing = null;
            this.stream = null;
            this.last_seek_time = 0;
        }
    };

    this.current_playback_progress = function() {
        if (this.dispatcher) {
            return this.dispatcher.streamTime + this.last_seek_time;
        } else {
            return false;
        }
    };

    this.total_queue_time = function() {
        let duration = moment.duration(0);
        let len = this.queue.getLength();
        for (let i = 0; i < len - 1; i++) {
            duration.add(this.queue.queue[i].duration);
        }
        if (this.now_playing && this.dispatcher) {
            duration.add(this.now_playing.duration).subtract(this.current_playback_progress(), 'ms');
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
}

module.exports.Player = Player;
