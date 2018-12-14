const token = process.env.DISCORD_APP_AUTH_TOKEN;
const youtube_api_key = process.env.YOUTUBE_API_KEY;
const Discord = require('discord.js');
const client = new Discord.Client();
const https = require('https');
const ytdl = require('youtube-dl');
const moment = require('moment');
const queue_module = require('./lib/queue.js');
const {search, video_info} = require('./lib/youtube_api.js');

const voice_only_commands = ['p','skip','play','loop','earrape','summon','join'];

var players = {};

var search_opts = {
    maxResults: 10,
    key: youtube_api_key,
    type: 'video'
};

var video_opts = {
    key: youtube_api_key,
    part: 'contentDetails,snippet'
}

var ytdl_opts = [];

var playback_opts = {};

function login() {
    try {
        client.login(token);
    } catch (err) {
        console.err(err);
        login();
    }
}
login();

client.on('ready', () => {
  console.log('I am ready!');

});

client.on('message', async message => {
	if (!message.guild || message.author.bot) return;

	if (message.content[0] == '!') {
		var regex_content = /^![a-zA-Z]* (.*)/;
		var content = '';
		var command = message.content.match(/^!([a-zA-Z]*)/)[1];
        if (!message.member.voice.channel) {
            if (voice_only_commands.includes(command)) {
                message.channel.send(':x: **You have to be in a voice channel to use this command.**');
            }
            return;
        }
		if (regex_content.test(message.content)) {
			content = message.content.match(regex_content)[1];
		}
        var guild_id = message.guild.id;
        var player = players[guild_id];
        if (!player) {
            player = players[guild_id] = new Player(message.member.voice.channel.id);
        }

		console.log('Command: ' + message.content);
		switch (command) {
			case 'p':
			case 'play':
                var connecting = player.connect(message.member.voice.channel);
                var search_res = null;
                var video_res = null;
                var url = content;
                var title = content;
                var search_string = content;
                var id_regex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                var id = null;
                message.channel.send('<:youtube:519902612976304145> **Searching** :mag_right: `' + search_string + '`');
                if (!url.startsWith('http')) {
                    try {
                        search_res = await search(search_string, search_opts);
                        search_res = search_res.results[0];
                        url = search_res.link;
                    } catch (err) {
                        console.error(err);
                        break;
                    }
                }
                player.enqueue(url);
                console.log('Added ' + url);
                await connecting;
                var playing = player.playing;
                player.play(message.member.voice.channel);
                if (url.includes('youtube') || url.includes('youtu.be') || search_res) {
                    id = url.match(id_regex)[1];
                    video_res = await video_info(id, video_opts);
                    video_res = video_res.results[0];
                    title = video_res.title
                }
                if (playing) {
                    if (video_res) {
                        const embed = new Discord.MessageEmbed()
                        .setTitle(title)
                        .setAuthor('Added to queue', message.author.avatarURL(), 'https://github.com/sasjafor/PunkBot')
                        .setURL('https://youtube.com/watch?v=' + id)
                        .setThumbnail('https://i.ytimg.com/vi/' + id + '/hqdefault.jpg')
                        .addField('Channel', video_res.channelTitle)
                        .addField('Song Duration', moment.duration(video_res.duration))
                        //.addField('Estimated time until playing', '')
                        .addField('Position in queue', player.queue.getLength());
                        message.channel.send(embed);
                    }
                } else {
                    message.channel.send('**Playing** :notes: `' + title + '` - Now!');
                }
				break;
            case 'summon':
            case 'join':
                player.connect(message.member.voice.channel);
                message.channel.send(':thumbsup: **Joined** ' + message.member.voice.channel.name);
                break;
            case 'earrape':
                player.earrape = !player.earrape;
                if (player.earrape) {
                    playback_opts.volume = 5000;
                    message.channel.send(':ear::boom: **Enabled**');
                } else {
                    playback_opts.volume = 1;
                    message.channel.send(':ear::boom: **Disabled**');
                }
                break;
			default:
                if (!player.conn) {
                    message.channel.send(':x: **I am not connected to a voice channel**, Use the summon command to get me in one');
                }
                switch (command) {
                    case 'skip':
                        var skip = player.skip();
                        if (skip) {
                            message.channel.send(':fast_forward: ***Skipped*** :thumbsup:');
                        } else {
                            message.channel.send(':x: **Nothing playing in this server**');
                        }
        				break;
                    case 'loop':
                        player.loop = !player.loop;
                        if (player.loop) {
                            message.channel.send(':repeat_one: **Enabled!**');
                        } else {
                            message.channel.send(':repeat_one: **Disabled!**');
                        }
                        break;
                    case 'disconnect':
                        player.disconnect();
                        message.channel.send(':mailbox_with_no_mail: **Successfully disconnected**');
                        break;
                    case 'seek':
                        //var num_regex = /([0-9]+)(?::)/g
                        //var time1 = num_regex.exec(content);
                        //var time2 = num_regex.exec(content);
                        //var seconds = content.match(/[0-9]+$/)[0];
                        //if (time) {
                        //    var minutes = time;
                        //    var hours = content;
                        //}
                        //console.log(content);
                        //console.log(time);
                        //console.log(seconds);
                        //console.log(minutes);
                        //console.log(hours);
                        //player.seek(content);
                        break;
                    default:
                        message.reply('This command is invalid! Please use a valid one.');
                }
		}
	}
});

async function startPlayback(message) {
	if (!conn) {
		if (message.member.voice.channel) {
			conn = await message.member.voice.channel.join()
			.catch(console.log);
			console.log('Joined Voice Channel');
		}
	}
	if (conn && !playing) {
		playing = true;
		console.log('Starting Playback');
		play();
	}
}

function Player(voice_channel_id) {
    this.queue = new queue_module.Queue();
    this.voice_channel_id = voice_channel_id;
    this.conn = null;
    this.now_playing = null;
    this.loop = false;
    this.playing = false;
    this.dispatcher = null;
    this.earrape = false;

    this.connect = async function(channel) {
        if (channel) {
            try {
                this.conn = await channel.join()
            } catch (err) {
                console.error(err);
            }
            console.log('Joined Voice Channel');
        }
    }

    this.enqueue = function(url) {
        this.queue.enqueue(url);
    }

    this.skip = function() {
        if (this.playing) {
            if (this.loop) {
                now_playing = this.queue.dequeue()
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
    	if(url.slice(-4,-3) == '.') {
    		stream = url;
    	} else {
    		stream = ytdl(url, ytdl_opts);
    	}
        return stream;
    }

    this.play = async function(channel) {
        if (this.playing) {
            return;
        }
        /*if (!this.conn) {
            await this.connect(channel);
        }*/
        this.playing = true;
        while (!this.queue.isEmpty()) {
            now_playing = this.queue.dequeue();
            do {
                try {
                    await this.send_audio();
                } catch (err) {
                    console.error(err);
                }
            } while (this.loop);
        }
        this.playing = false;
    }

    this.send_audio = function() {
        return new Promise((resolve, reject) => {
            if (!now_playing) {
                return;
            }
            var stream = this.create_stream(now_playing);
            if (stream && this.conn) {
        		console.log('Playing: ' + now_playing);
        		this.dispatcher = this.conn.play(stream, playback_opts);
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

    this.disconnect = function() {
        if (this.conn) {
            this.conn.disconnect();
            this.conn = null;
            this.queue = new queue_module.Queue();
            this.playing = false;
            this.dispatcher = null;
            this.now_playing = null;
        }
    }
}

client.on('error', error => {
	console.error(error);
});

client.on('warn', warning => {
	console.warn(warning);
});
