const debug = require('debug')('basic');
const debugv = require('debug')('verbose');
const ytdl = require('ytdl-core');
const ytdl_full = require('youtube-dl');
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
        if (this.loop) {
            url = this.now_playing;
        } else {
            url = this.now_playing = this.dequeue();
        }

        if (!url) {
            return;
        }
        this.stream = this.create_stream(url);

        if (this.stream && this.conn) {
            debugv('Playing: ' + url);
            playback_opts.type = 'webm/opus'; // need to check if actually webm/opus stream
            this.dispatcher = this.conn.play(this.stream, playback_opts);
            this.dispatcher.on('finish', () => {
                this.emit('end');
            });
            this.dispatcher.on('error', error => {
                debug(error);
            });
        }
    });

    this.controller.on('end', () => {
        if (this.queue.isEmpty()) {
            this.playing = false;
            this.timeout = setTimeout(function(){
                this.disconnect();
            }, 120000);
        } else {
            this.controller.emit('play');
        }
    });

    this.play = function(channel) {
        if (this.playing) {
            return;
        }
        this.playing = true;
        this.controller.emit('play');
    }

    this.connect = async function(channel) {
        if (channel) {
            try {
                this.conn = await channel.join()
                this.conn.on('failed', err => {
                    debug(err);

                }
            } catch (err) {
                debug(err);
            }
            debug('Joined Voice Channel');
        }
    }

    this.enqueue = function(url) {
        this.queue.enqueue(url);
    }

    this.dequeue = function() {
        return this.queue.dequeue();
    }

    this.pre_play = function(url) {
        this.now_playing = url;
        this.curr_stream = this.create_stream(url);
    }

    this.skip = function() {
        if (this.playing) {
            if (this.loop) {
                this.now_playing = this.queue.dequeue()
            }
            this.dispatcher.end();
            return true;
        } else {
            return false;
        }
    }



    this.send_audio = function() {
        return new Promise((resolve, reject) => {
            // console.time("audio");
            if (!this.now_playing) {
                return;
            }
            //var stream = this.create_stream(now_playing);
            var stream = this.curr_stream;
            if (stream && this.conn) {
                debugv('Playing: ' + this.now_playing);
                this.dispatcher = this.conn.play(stream, playback_opts);
                // console.timeEnd("audio");
                this.dispatcher.on('finish', () => {
                    resolve();
                });
                this.dispatcher.on('error', error => {
                    debug(error);
                    reject(Error('StreamDispatcher encountered an error'))
                });
            }
        });
    }

    this.create_stream = function(url) {
        var stream = null;
        // this is most likely unsafe, but it works for now
        if (url.slice(-4, -3) == '.') {
            stream = url;
        } else if (url.startsWith('https://www.youtube.com') || url.startsWith('https://youtu.be')) {
            // ytdl.getInfo(ytdl.getURLVideoID(url), (err, info) => {
            //     if (err) throw err;
            //     let format = ytdl.chooseFormat(info.formats, { quality: '249,250,251' });
            //     info.formats = format;
            //     stream = ytdl.downloadFromInfo(info);
            // });
            stream = ytdl(url, { filter: format => {
                return format.type === 'audio/webm; codecs="opus"';
            }})

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
            debugv('Seek_time=' + time);
            var opts = playback_opts;
            opts.seek = time;
            var stream = this.create_stream(now_playing);
            this.dispatcher = this.conn.play(stream, opts);
            return 0;
        } else {
            return 2;
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
        }
    }
}

module.exports.Player = Player;
