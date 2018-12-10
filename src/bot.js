const token = process.env.DISCORD_APP_AUTH_TOKEN;
const youtube_api_key = process.env.YOUTUBE_API_KEY;
const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require('youtube-dl');
const search = require('youtube-search');
const queue_module = require('./lib/queue.js');
var players = {};

var api_opts = {
    maxResults: 10,
    key: youtube_api_key,
    type: 'video',
    maxBuffer:1000*1024
};

var ytdl_opts = [];

var playback_opts = {};

try {
	client.login(token);
} catch (err) {
	console.err(err);
}

client.on('ready', () => {
  console.log('I am ready!');

});

client.on('message', async message => {
	if (!message.guild || message.author.bot) return;

    if (!message.member.voice.channel) {
        message.channel.send(':x: **You have to be in a voice channel to use this command.**');
        return;
    }

	if (message.content[0] == '!') {
		var regex_content = /^![a-zA-Z]* (.*)/;
		var content = "";
		var command = message.content.match(/^!([a-zA-Z]*)/)[1];
		if (regex_content.test(message.content)) {
			content = message.content.match(regex_content)[1];
		}
        var guild_id = message.guild.id;
        var player = players[guild_id];
        if (!player) {
            player = players[guild_id] = new Player(message.member.voice.channel.id);
        }

		console.log("Command: " + command);
		console.log("Content: " + content);
		switch (command) {
			case "p":
			case "play":
                var connecting = player.connect(message.member.voice.channel);
                var res = null;
                var url = content;
                var title = content;
                var search_string = content;
                message.channel.send('<:youtube:519902612976304145> **Searching** :mag_right: `' + search_string + "`");
                if (!url.startsWith("http") || url.includes("youtube") || url.includes("youtu.be")) {
                    try {
                        var search_res = await search(search_string, api_opts);
                        res = search_res.results[0];
                        if (res) {
                            url = res.link;
                            title = res.title;
                        }
                    } catch (err) {
                        console.error(err);
                        break;
                    }
                }
                player.enqueue(url);
                console.log("Added " + url);
                await connecting;
                player.play(message.member.voice.channel);
                message.channel.send('**Playing** :notes: `' + title + "` - Now!");
				break;
            case "summon":
            case "join":
                player.connect(message.member.voice.channel);
                message.channel.send(':thumbsup: **Joined** ' + message.member.voice.channel.name);
                break;
            case "earrape":
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
                    case "skip":
                        var skip = player.skip();
                        if (skip) {
                            message.channel.send(':fast_forward: ***Skipped*** :thumbsup:');
                        } else {
                            message.channel.send(':x: **Nothing playing in this server**');
                        }
        				break;
                    case "loop":
                        player.loop = !player.loop;
                        if (player.loop) {
                            message.channel.send(':repeat_one: **Enabled!**');
                        } else {
                            message.channel.send(':repeat_one: **Disabled!**');
                        }
                        break;
                    default:
                        message.reply("This command is invalid! Please use a valid one.");
                }
		}
	}
});

async function startPlayback(message) {
	if (!conn) {
		if (message.member.voice.channel) {
			conn = await message.member.voice.channel.join()
			.catch(console.log);
			console.log("Joined Voice Channel");
		}
	}
	if (conn && !playing) {
		playing = true;
		console.log("Starting Playback");
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
            console.log("Joined Voice Channel");
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
                await this.send_audio();
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
        		console.log("Playing: " + now_playing);
        		this.dispatcher = this.conn.play(stream, playback_opts);
        		this.dispatcher.on('finish', () => {
                    resolve();
        		});
        		this.dispatcher.on('error', error => {
        			console.error(error);
                    reject(Error("StreamDispatcher encountered an error"))
        		});
        	}
        });
    }

    this.disconnect = function() {
        if (this.conn) {
            this.conn.disconnect();
            this.conn = null;
        }
    }
}

client.on('error', error => {
	console.error(error);
});

client.on('warn', warning => {
	console.warn(warning);
});
