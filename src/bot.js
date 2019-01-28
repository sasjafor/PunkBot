const token = process.env.DISCORD_APP_AUTH_TOKEN;
const youtube_api_key = process.env.YOUTUBE_API_KEY;
const Discord = require('discord.js');
const client = new Discord.Client();
const moment = require('moment');
const debug = require('debug')('basic');
const debugv = require('debug')('verbose');
const {
    Player
} = require('./lib/player.js');
const {
    PlaybackItem
} = require('./lib/playback_item.js');
const {
    fast_search,
    video_info,
    playlist_info
} = require('./lib/youtube_api.js');

const bot_in_voice_only_commands = ['skip', 'loop', 'clear', 'remove', 'seek', 'disconnect', 'volume', 'vol', 'np', 'now_playing', 'shuffle'];
const voice_only_commands = ['p', 'play', 'seek', 'summon', 'join', ...bot_in_voice_only_commands];

const strings = {
    need_to_be_in_voice: ':x: **You have to be in a voice channel to use this command.**',
    no_permission_to_connect: ':no_good: **No permission to connect to** ',
    searching_for: '<:youtube:519902612976304145> **Searching** :mag_right: ',
    no_matches: ':x: **No matches**',
    joined: ':thumbsup: **Joined** ',
    not_connected: ':x: **I am not connected to a voice channel**, Use the summon command to get me in one',
    skipped: ':fast_forward: ***Skipped*** :thumbsup:',
    nothing_playing: ':x: **Nothing playing in this server**',
    cleared: ':boom: ***Cleared...*** :stop_button:',
    loop_enabled: ':repeat_one: **Enabled!**',
    loop_disabled: ':repeat_one: **Disabled!**',
    disconnected: ':mailbox_with_no_mail: **Successfully disconnected**',
    volume_set: ':sound:  **Set to** ',
    invalid_seek_format: ':x: **Invalid format**, Example formats:\n\n`0:30` `1:30` `2:15` `5:20`',
    invalid_vol_format: ':x: **Invalid format**, Example formats:\n\n\t`1`\t `2`\t `0.5`',
    seek_too_long: ':x: **Time cannot be longer than the song**',
    invalid_command: '**This command is invalid! Please use a valid one.**',
    removed: ':white_check_mark: **Removed** ',
    out_of_range: ':x: **Out of range**',
    shuffled: '**Shuffled queue** :ok_hand:'
};

var players = {};

var video_opts = {
    key: youtube_api_key,
    part: 'contentDetails,snippet'
};

var playlist_opts = {
    key: youtube_api_key,
    part: 'contentDetails',
    maxResults: 50
};

function login() {
    try {
        client.login(token);
    } catch (err) {
        debug(err);
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
        var content = null;
        var command = message.content.match(/^!([a-zA-Z]*)/)[1];
        if (!message.channel.permissionsFor(message.guild.me).has('SEND_MESSAGES')) {
            return;
        }
        if (!message.member.voice.channel) {
            if (voice_only_commands.includes(command)) {
                message.channel.send(strings.need_to_be_in_voice);
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
            case 'play': {
                if (!content) {
                    let embed = new Discord.MessageEmbed()
                        .setDescription(':x: **Missing args**\n\n!play [Link or query]')
                        .setColor('#ff0000');
                    message.channel.send(embed);
                    return;
                }
                if (!message.member.voice.channel.joinable) {
                    message.channel.send(strings.no_permission_to_connect + '`' + message.member.voice.channel.name + '`');

                }

                let playing = player.playing;
                let connecting = null;
                if (!playing) {
                    connecting = player.connect(message.member.voice.channel);
                }

                let search_res = null;
                let url = null;
                let id = null;
                let title = content;
                let search_string = content;

                message.channel.send(strings.searching_for + '`' + search_string + '`');
                if (!content.startsWith('http')) {
                    try {
                        search_res = await fast_search(search_string, youtube_api_key);
                        if (search_res) {
                            url = search_res.url;
                            id = search_res.id;
                            title = search_res.title;
                        } else {
                            message.channel.send(strings.no_matches);
                            return;
                        }
                    } catch (err) {
                        debug(err);
                        return;
                    }
                } else {
                    url = content;
                }

                let playlist_id_regex = /(?:youtube(?:-nocookie)?\.com\/(?:[^/\n\s]+\/\S+\/|(?:playlist|e(?:mbed)?\/videoseries)\/|\S*?\?list=)|youtu\.be\/)([a-zA-Z0-9_-]{34})/;
                if (playlist_id_regex.test(url)) {
                    let playlist_id = url.match(playlist_id_regex)[1];
                    let playlist_callback = function(num) {message.channel.send(':white_check_mark: **Enqueued** `' + num + '` songs');};
                    if (!playing) {
                        let custom_opts = {
                            ...playlist_opts
                        };
                        custom_opts.maxResults = 1;
                        custom_opts.part = 'snippet,contentDetails';
                        let playlist_res = await playlist_info(playlist_id, custom_opts);
                        if (playlist_res) {
                            id = playlist_res.results[0].videoId;
                            url = 'https://www.youtube.com/watch?v=' + id;
                            title = playlist_res.results[0].title;
                        }
                        handle_playlist(player, playlist_id, message.author, true, playlist_callback);
                    } else {
                        handle_playlist(player, playlist_id, message.author, false, playlist_callback);
                        return;
                    }
                }

                if (!id) {
                    let id_regex = /(?:youtube(?:-nocookie)?\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                    id = url.match(id_regex)[1];
                }
                let pb = handle_video(id, message.author);
                if (!playing) {
                    let pb_short = new PlaybackItem(url, message.author, title);
                    player.enqueue(pb_short);

                    debugv('Added ' + url);
                    await connecting;
                    player.play();
                    message.channel.send('**Playing** :notes: `' + title + '` - Now!');
                    pb = await pb;
                    pb_short.setTitle(pb.title);
                    pb_short.setDuration(pb.duration);
                    pb_short.setThumbnailURL(pb.thumbnailURL);
                    pb_short.setChannelTitle(pb.channelTitle);
                } else {
                    let embed = null;
                    pb = await pb;
                    if (url.includes('youtube') || url.includes('youtu.be')) {
                        if (pb) {
                            player.enqueue(pb);
                            var pretty_duration = prettifyTime(pb.duration);
                            var time_until_playing = player.total_queue_time();
                            var pretty_tut = prettifyTime(time_until_playing);
                            embed = new Discord.MessageEmbed()
                                .setTitle(title)
                                .setAuthor('Added to queue', message.author.avatarURL(), 'https://github.com/sasjafor/PunkBot')
                                .setURL(url)
                                .setThumbnail(pb.thumbnailURL)
                                .addField('Channel', pb.channelTitle)
                                .addField('Song Duration', pretty_duration)
                                .addField('Estimated time until playing', pretty_tut)
                                .addField('Position in queue', player.queue.getLength());
                        }
                    } else {
                        //TODO: embed for non youtube links
                    }
                    if (embed) {
                        message.channel.send(embed);
                    }
                }
                break;
            }
            case 'summon':
            case 'join': {
                if (!message.member.voice.channel.joinable) {
                    message.channel.send(strings.no_permission_to_connect + '`' + message.member.voice.channel.name + '`');
                    return;
                }
                await player.connect(message.member.voice.channel);
                message.channel.send(strings.joined + '`' + message.member.voice.channel.name + '`');
                break;
            }
            default:
                if (!player.conn && bot_in_voice_only_commands.includes(command)) {
                    message.channel.send(strings.not_connected);
                    return;
                }
                switch (command) {
                    case 'skip': {
                        let skip = player.skip();
                        if (skip) {
                            message.channel.send(strings.skipped);
                        } else {
                            message.channel.send(strings.nothing_playing);
                        }
                        break;
                    }
                    case 'clear': {
                        player.clear();
                        message.channel.send(strings.cleared);
                        break;
                    }
                    case 'remove': {
                        let num = parseInt(content);
                        if (num !== 0 && !num) {
                            let embed = new Discord.MessageEmbed()
                                .setDescription(':x: **Invalid format**\n\n!remove [Entry]')
                                .setColor('#ff0000');
                            message.channel.send(embed);
                            return;
                        }
                        let remove_res = player.remove(num);
                        if (remove_res) {
                            message.channel.send(strings.removed + '`' + remove_res.title + '`');
                        } else {
                            message.channel.send(strings.out_of_range);
                        }
                        break;
                    }
                    case 'loop': {
                        player.loop = !player.loop;
                        if (player.loop) {
                            message.channel.send(strings.loop_enabled);
                        } else {
                            message.channel.send(strings.loop_disabled);
                        }
                        break;
                    }
                    case 'disconnect': {
                        player.disconnect();
                        message.channel.send(strings.disconnected);
                        break;
                    }
                    case 'vol':
                    case 'volume': {
                        let vol_regex = /(0\.)?[0-9]+/;
                        if (!vol_regex.test(content)) {
                            message.channel.send(strings.invalid_vol_format);
                            return;
                        }
                        let value = content;
                        player.setVolume(value);
                        message.channel.send(strings.volume_set + '`' + value + '`');
                        break;
                    }
                    case 'dbg':
                    case 'debug': {
                        debugv(player.stream);
                        break;
                    }
                    case 'np':
                    case 'now_playing': {
                        let np = player.getNowPlaying();
                        let progress = player.getProgress();
                        if (np && progress) {
                            let progress_bar = buildProgressBar(progress, np.duration);
                            let progress_string = prettifyTime(progress) + ' / ' + prettifyTime(np.duration);
                            let embed = new Discord.MessageEmbed()
                                .setTitle(np.title)
                                .setAuthor('Now Playing ♪', client.user.avatarURL(), 'https://github.com/sasjafor/PunkBot')
                                .setURL(np.url)
                                .setThumbnail(np.thumbnailURL)
                                .setColor('#0056bf')
                                .setDescription('\u200B\n`' + progress_bar + '`\n\n`' + progress_string + '`\n\n`Requested by:` ' + np.requester.username);
                            message.channel.send(embed);
                        } else {
                            message.channel.send(strings.nothing_playing);
                        }
                        break;
                    }
                    case 'shuffle': {
                        player.shuffle();
                        message.channel.send(strings.shuffled);
                        debug('Shuffled queue');
                        break;
                    }
                    case 'seek': {
                        let seek_time_regex = /(([0-9]+:)?([0-9]+:)?)?[0-9]+$/;
                        if (!seek_time_regex.test(content) || (content.match(seek_time_regex)).index != 0) {
                            message.channel.send(strings.invalid_seek_format);
                            return;
                        }
                        let min_hour_regex = /([0-9]+)(?::)/g;
                        let time1 = min_hour_regex.exec(content);
                        let time2 = min_hour_regex.exec(content);
                        let seconds = parseInt(content.match(/[0-9]+$/)[0], 10);
                        let minutes = 0;
                        let hours = 0;
                        if (time1) {
                            if (time2) {
                                minutes = parseInt(time2[1], 10);
                                hours = parseInt(time1[1], 10);
                            } else {
                                minutes = parseInt(time1[1], 10);
                            }
                        }
                        let seek_time = 3600 * hours + 60 * minutes + seconds;
                        let duration = moment.duration(seek_time * 1000);
                        let res_code = player.seek(seek_time);
                        switch (res_code) {
                            case 0:
                                var pretty_time = prettifyTime(duration);
                                message.channel.send(':musical_note: **Set position to**' + '`' + pretty_time + '`' + ':fast_forward:');
                                break;
                            case 1:
                                message.channel.send(strings.seek_too_long);
                                break;
                            case 2:
                                message.channel.send(strings.nothing_playing);
                                break;
                        }
                        break;
                    }
                    default:
                        message.channel.send(strings.invalid_command);
                }
        }
    }
});

client.on('error', error => {
    debug(error);
});

client.on('warn', warning => {
    debug(warning);
});

function prettifyTime(duration) {
    if (duration) {
        let hours = duration.hours() + duration.days() * 24;
        let minutes = duration.minutes();
        let seconds = duration.seconds();
        var pretty_hours = ((hours / 10 < 1) ? '0' : '') + hours + ':';
        var pretty_minutes = ((minutes / 10 < 1) ? '0' : '') + minutes + ':';
        var pretty_seconds = ((seconds / 10 < 1) ? '0' : '') + seconds;
        var pretty_time = ((hours > 0) ? pretty_hours : '') + pretty_minutes + pretty_seconds;
        return pretty_time;
    } else {
        throw new Error('Invalid duration provided');
    }
}

function buildProgressBar(progress, total_time) {
    let pr = progress.asSeconds();
    let tt = total_time.asSeconds();
    let mul = 30 / tt;
    let pos = Math.round(pr * mul);
    debugv('pr: ' + pr);
    debugv('tt: ' + tt);
    debugv('mul: ' + mul);
    debugv('pos: ' + pos);
    let res = '';
    for (let i = 0; i < pos; i++) {
        res += '▬';
    }
    res += '🔘';
    let rest = 30 - pos;
    for (let i = 0; i < rest; i++) {
        res += '▬';
    }
    return res;
}

async function handle_video(id, requester) {
    let res = await video_info(id, video_opts);
    res = res.results[0];

    if (res) {
        let url = 'https://www.youtube.com/watch?v=' + id;
        let title = res.title;
        let thumbnailURL = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
        let duration = moment.duration(res.duration);
        let channelTitle = res.channelTitle;
        return new PlaybackItem(url, requester, title, thumbnailURL, duration, channelTitle);
    } else {
        throw new Error('Failed to get video info');
    }
}

async function handle_playlist(player, id, requester, skip_first, callback) {
    let skipped = false;
    let page_info = null;
    let page_token = null;
    let k = 0;
    do {
        let res = await playlist_info(id, playlist_opts, page_token);
        page_info = res.pageInfo;
        page_token = (page_info) ? page_info.nextPageToken : null;
        let items = res.results;

        for (let i of items) {
            if (skipped || !skip_first) {
                let video = handle_video(i.videoId, requester);
                player.enqueue(video);
                //debugv('Enqueued: ' + video.url);
            }
            skipped = true;
            k++;
        }
    } while (page_info.nextPageToken);
    debugv('DONE processing playlist!');
    if (callback) {callback(k);}
}
