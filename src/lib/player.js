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

    this.voice_channel_id = voice_channel_id;
    this.conn = null;

    this.playing = false;

    this.earrape = false;

    this.emit = function(...args) {
        debugv('Emit! with ' + args);
        this.controller.emit(...args);
    }

    this.controller.on('play', () => {
        var url = this.now_playing = this.queue.dequeue();
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
                console.error(error);
            });
        }

        if (this.loop) {
            this.emit('loop');
        }
    });

    this.controller.on('loop', () => {
        this.stream = this.create_stream(this.now_playing);
        this.stream.pipe(this.dispatcher);
    });

    this.controller.on('end', () => {
        // if (this.loop && this.dispatcher) {
        //     this.stream = this.create_stream(this.now_playing);
        //     this.stream.pipe(this.dispatcher);
        // }
    });

    this.connect = async function(channel) {
        if (channel) {
            try {
                this.conn = await channel.join()
            } catch (err) {
                console.error(err);
            }
            debug('Joined Voice Channel');
        }
    }

    this.enqueue = function(url) {
        this.queue.enqueue(url);
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

    this.play = function(channel) {
        if (this.playing) {
            return;
        }
        /*if (!this.conn) {
            await this.connect(channel);
        }*/
        this.playing = true;
        this.controller.emit('play');

        // while (!this.queue.isEmpty()) {
        //     do {
        //         try {
        //             // console.timeEnd("total");
        //             await this.send_audio();
        //         } catch (err) {
        //             console.error(err);
        //         }
        //     } while (this.loop);
        //     this.now_playing = this.queue.dequeue();
        //     this.curr_stream = this.create_stream(this.now_playing);
        // }
        // this.playing = false;
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
                    console.error(error);
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
