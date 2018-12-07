const token = process.env.DISCORD_APP_AUTH_TOKEN;
const youtube_api_key = process.env.YOUTUBE_API_KEY;
const Discord = require('discord.js');
const exec = require('child_process').exec;
const fs = require('fs');
const https = require('https');
const client = new Discord.Client();
const ytdl = require('youtube-dl');
const search = require('youtube-search');
const queue_module = require('./lib/queue.js');
var conn = null;
var queue = new queue_module.Queue();
var playing = false;
var loop = false;

var opts = {
  maxResults: 10,
  key: youtube_api_key,
  type: 'video'
};

client.on('ready', () => {
  console.log('I am ready!');

});

client.on('message', async message => {
	if (!message.guild) return;

	if (message.content[0] == '!') {
		var regex_content = /^![a-zA-Z]* (.*)/;
		var content = "";
		var command = message.content.match(/^!([a-zA-Z]*)/)[1];
		if (regex_content.test(message.content)) {
			content = message.content.match(regex_content)[1];
		}

		console.log("Command: " + command);
		console.log("Content: " + content);
		switch (command) {
			case "p":
			case "play":
                var res = null;
                var url = null;
				if (content.startsWith("http")) {
					url = content;
				} else {
					var search_string = content;
                    message.channel.send('<:youtube:519902612976304145> **Searching** :mag_right: `' + search_string + "`");
                    try {
                        var search_res = await search(search_string, opts);
                        res = search_res.results[0];
                        url = res.link;
                        console.log(url);
                    } catch (e) {
                        console.error(e);
                        break;
                    }
				}
                queue.enqueue(url);
                console.log("Added " + url);
                if (!playing) {
                    startPlayback(message);
                    message.channel.send('**Playing** :notes: `' + res.title + "` - Now!");
                }
				break;
			case "skip":
                if (playing) {
				    if (queue.isEmpty()) {
                        if (conn) {
						    conn.disconnect();
						    conn = null;
					    }
					    playing = false;
				    } else {
                        play();
                    }
                    message.channel.send(':fast_forward: ***Skipped*** :thumbsup:');
				}
				break;
            case "loop":
                loop = !loop;
                if (loop) {
                    message.channel.send(':repeat_one: **Enabled!**');
                } else {
                    message.channel.send(':repeat_one: **Disabled!**');
                }
                break;
			default:
				message.reply("This command is invalid! Please use a valid one.");
		}
	}
});

client.login(token);

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

async function play() {
    if (loop) {
        url = queue.peek();
    } else {
        url = queue.dequeue();
    }
	console.log("Trying to play: " + url);
	stream = null;
	if(url.slice(-4,-3) == '.') {
		stream = url;
	} else {
		stream = ytdl(url);
	}
	if (stream && conn) {
		console.log("Playing: " + url);
		var dispatcher = conn.play(stream);
		dispatcher.on('finish', () => {
			if (!queue.isEmpty()) {
				play();
			} else {
				playing = false;
				if (conn) {
					conn.disconnect();
					conn = null;
				}
			}
		});
		dispatcher.on('error', error => {
			console.log(error);
			playing = false;
			if (conn) {
				conn.disconnect();
				conn = null;
			}
		});
	}
}
