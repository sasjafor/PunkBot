const token = process.env.DISCORD_APP_AUTH_TOKEN;
const youtube_api_key = process.env.YOUTUBE_API_KEY;
const Discord = require('discord.js');
const client = new Discord.Client();
const https = require('https');
const moment = require('moment');
const debug = require('debug')('basic');
const debugv = require('debug')('verbose');
const {
    Player
} = require('./lib/player.js');
const {
    search,
    fast_search,
    video_info
} = require('./lib/youtube_api.js');

const voice_only_commands = ['p', 'skip', 'play', 'loop', 'earrape', 'summon', 'join'];

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
    debug('I am ready!');

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

        debugv('Command: ' + message.content);
        switch (command) {
            case 'p':
            case 'play':
                var connecting = player.connect(message.member.voice.channel);
                var search_res = null;
                var video_res = null;
                var url = content;
                var title = content;
                var search_string = content;
                message.channel.send('<:youtube:519902612976304145> **Searching** :mag_right: `' + search_string + '`');
                if (!url.startsWith('http')) {
                    try {
                        url = await fast_search(search_string, youtube_api_key);
                    } catch (err) {
                        debug(err);
                        break;
                    }
                }
                player.enqueue(url);
                var playing = player.playing;
                // if (!playing) {
                //     player.pre_play(url);
                // }
                debugv('Added ' + url);
                await connecting;

                player.play(message.member.voice.channel);
                if (playing && (url.includes('youtube') || url.includes('youtu.be'))) {
                    var id_regex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                    var id = url.match(id_regex)[1];
                    video_res = await video_info(id, video_opts);
                    video_res = video_res.results[0];
                    title = video_res.title

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
                message.channel.send(':thumbsup: **Joined** ' + '`' +message.member.voice.channel.name) + '`';
                break;
            case 'volume':
                // TODO: add checking for correct format
                var value = content;
                player.setVolume(value);
                playback_opts.volume = value;
                message.channel.send(':loud_sound:  **Set to** `' + value + '`');
                break;
            default:
                if (!player.conn) {
                    message.channel.send(':x: **I am not connected to a voice channel**, Use the summon command to get me in one');
                    break;
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
                    case 'clear':
                        player.clear();
                        message.channel.send(':boom: ***Cleared...*** :stop_button:');
                        break;
                    case 'loop':
                        player.loop();
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
                        if ((content.match(/([0-9]+:?[0-9]+:?)?[0-9]+$/)).index != 0) {
                            message.channel.send(':x: **Invalid format**, Example formats:\n\n`0:30` `1:30` `2:15` `5:20`');
                        }
                        debugv((content.match(/([0-9]+:?[0-9]+:?)?[0-9]+$/)));
                        debugv((content.match(/([0-9]+:?[0-9]+:?)?[0-9]+$/)).index == 0);
                        var min_hour_regex = /([0-9]+)(?::)/g
                        var time1 = min_hour_regex.exec(content);
                        var time2 = min_hour_regex.exec(content);
                        var seconds = content.match(/[0-9]+$/)[0];
                        var minutes = 0;
                        var hours = 0;
                        if (time1) {
                            if (time2) {
                                minutes = time2[1];
                                hours = time1[1];
                            } else {
                                minutes = time1[1];
                            }
                        }
                        debugv(content);
                        debugv(seconds);
                        debugv(minutes);
                        debugv(hours);
                        var seek_time = 3600 * hours + 60 * minutes + seconds;
                        var res_code = player.seek(seek_time);
                        switch (res_code) {
                            case 0:
                                if (seconds >= 60) {
                                    var secr = seconds % 60;
                                    var secm = seconds / 60;
                                    seconds = seconds - secr;
                                    minutes = minutes + secm;
                                }
                                if (minutes >= 60) {
                                    var minr = minutes % 60;
                                    var minm = minutes / 60;
                                    minutes = minutes - minr;
                                    hours = hours + minm;
                                }
                                var pretty_hours = ((hours / 10 < 1) ? '0' : '') + hours + ':';
                                var pretty_minutes = ((minutes / 10 < 1) ? '0' : '') + minutes + ':';
                                var pretty_seconds = ((seconds / 10 < 1) ? '0' : '') + seconds;
                                var pretty_time = (hours > 0) ? pretty_hours : '' + pretty_minutes + pretty_seconds;
                                message.channel.send(':musical_note: **Set position to**' + '`' + pretty_time + '`' + ':fast_forward:');
                                break;
                            case 1:
                                message.channel.send(':x: **Time cannot be longer than the song**');
                                break;
                            case 2:
                                message.channel.send(':x: **Nothing playing in this server**');
                                break;
                            default:
                        }
                        break;
                    default:
                        message.channel.send('This command is invalid! Please use a valid one.');
                }
        }
    }
});

client.on('error', error => {
    debug(error);
});

client.on('warn', warning => {
    console.warn(warning);
});
