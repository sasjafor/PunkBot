const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const decode = require('unescape');
const moment = require('moment');
const Debug = require('debug');
const debug = Debug('punk_bot');
const debugv = Debug('punk_bot:verbose');
const debugd = Debug('punk_bot:debug');

const { players, youtubeAPIKey } = require('../bot.js');
const { PlaybackItem } = require('../lib/playback_item.js');
const { strings } = require('../lib/strings.js');
const { prettifyTime } = require('../lib/util.js');
const { fast_search,
        playlist_info,
        video_info,
} = require('../lib/youtube_api.js');

var video_opts = {
    key: youtubeAPIKey,
    part: 'contentDetails,snippet'
};

var playlist_opts = {
    key: youtubeAPIKey,
    part: 'contentDetails',
    maxResults: 50
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays a YouTube video.')
        .addStringOption(option => 
            option.setName('search')
                .setDescription('YouTube link or search term.')
                .setRequired(true))
    ,
	async execute(interaction) {
        let searchQuery = interaction.options.getString('search');
        if (!searchQuery) {
            let embed = new MessageEmbed()
                .setDescription(':x: **Missing args**\n\n!play [Link or query]')
                .setColor('#ff0000');
            interaction.reply({embeds: [embed], ephemeral: true});
            return;
        }
        if (!interaction.member.voice.channel.joinable) {
            interaction.reply({ content: strings.no_permission_to_connect + interaction.member.voice.channel.name, ephemeral: true });
            return;
        }

        let guildId = interaction.guild.id;
        let player = players[guildId];
        let connecting = null;
        if (!player.playing) {
            connecting = player.connect(interaction.member.voice.channel);
        }

        let search_res = null;
        let url = null;
        let id = null;
        let title = searchQuery;
        let search_string = searchQuery;

        let searchReply = interaction.reply({ content: strings.searching_for + '' + search_string + '' });
        if (!searchQuery.startsWith('http')) {
            try {
                search_res = await fast_search(search_string, youtubeAPIKey);
                if (search_res) {
                    url = search_res.url;
                    id = search_res.id;
                    title = search_res.title;
                } else {
                    interaction.reply({ content: strings.no_matches, ephemeral: true});
                    return;
                }
            } catch (err) {
                debug(err);
                return;
            }
        } else {
            url = searchQuery;
        }

        let playlist_id_regex = /(?:youtube(?:-nocookie)?\.com\/(?:[^/\n\s]+\/\S+\/|(?:playlist|e(?:mbed)?\/videoseries)\/|\S*?\?list=)|youtu\.be\/)([a-zA-Z0-9_-]{34})/;
        if (playlist_id_regex.test(url)) {
            let playlist_id = url.match(playlist_id_regex)[1];
            let playlist_callback = function(num) {
                interaction.reply({ content: ':white_check_mark: **Enqueued** `' + num + '` songs' });
            };
            if (!player.playing) {
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
                handle_playlist(player, playlist_id, interaction.member, true, playlist_callback);
            } else {
                handle_playlist(player, playlist_id, interaction.member, false, playlist_callback);
                return;
            }
        }

        if (!id) {
            id = getYTid(url);
        }

        let isYT = id != null;

        let pbP = handle_video(id, interaction.member, url);
        if (!player.playing) {
            let pb_short = new PlaybackItem(url, interaction.member.displayName, interaction.user.id, interaction.member.displayAvatarURL(), title);
            player.enqueue(pb_short);

            debugv('Added ' + url);
            await connecting;
            player.play();
            await searchReply;
            interaction.editReply({ content: strings.playing + decode(title) });
            let pb = await pbP;
            pb_short.setTitle(pb.title);
            pb_short.setDuration(pb.duration);
            pb_short.setThumbnailURL(pb.thumbnailURL);
            pb_short.setChannelTitle(pb.channelTitle);
        } else {
            let embed = null;
            let pb = await pbP;
            if (isYT) {
                if (pb) {
                    var pretty_duration = prettifyTime(pb.duration);
                    var time_until_playing = await player.getTotalRemainingPlaybackTime();
                    var pretty_tut = prettifyTime(time_until_playing);
                    player.enqueue(pb);
                    embed = new MessageEmbed()
                        .setTitle(pb.title)
                        .setAuthor({ name: 'Added to queue', iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'})
                        .setURL(url)
                        .setThumbnail(pb.thumbnailURL)
                        .addField('Channel', pb.channelTitle)
                        .addField('Song Duration', pretty_duration)
                        .addField('Estimated time until playing', pretty_tut)
                        .addField('Position in queue', String(player.queue.getLength()));
                }
            } else {
                //TODO: embed for non youtube links
            }
            if (embed) {
                await searchReply;
                interaction.editReply({ content: null, embeds: [embed] });
            }
        }
	},
};

function getYTid(url) {
    let id_regex = /(?:youtube(?:-nocookie)?\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    let match = url.match(id_regex);

    if (match && match.length > 1) {
        return match[1];
    } else {
        return null;
    }
}

async function handle_video(id, requester, url) {
    if (id) {
        let res = await video_info(id, video_opts);
        res = res.results[0];

        if (res) {
            let YTurl = 'https://www.youtube.com/watch?v=' + id;
            let title = res.title;
            let thumbnailURL = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
            let duration = moment.duration(res.duration);
            let channelTitle = res.channelTitle;
            return new PlaybackItem(YTurl, requester.displayName, requester.user.id, requester.displayAvatarURL(), title, thumbnailURL, duration, channelTitle);
        } else {
            throw new Error('Failed to get video info');
        }
    } else {
        return new PlaybackItem(url, requester, url, null, moment.duration("0"), null);
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
            }
            skipped = true;
            k++;
        }
    } while (page_info.nextPageToken);
    debugd('DONE processing playlist!');
    if (callback) {
        callback(k);
    }
}