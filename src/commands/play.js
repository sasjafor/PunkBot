const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const decode = require('unescape');
const moment = require('moment');
const Debug = require('debug');
const debug = Debug('punk_bot');
const debugv = Debug('punk_bot:verbose');
const debugd = Debug('punk_bot:debug');

const { players, youtubeAPIKey } = require('../bot.js');
const { PlaybackItem } = require('../lib/playback-item.js');
const { strings } = require('../lib/strings.js');
const { prettifyTime } = require('../lib/util.js');
const { fastSearch,
        playlistInfo,
        videoInfo,
} = require('../lib/youtube-api.js');

var videoOpts = {
    key: youtubeAPIKey,
    part: 'contentDetails,snippet'
};

var playlistOpts = {
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
            interaction.reply({ content: strings.noPermissionToConnect + interaction.member.voice.channel.name, ephemeral: true });
            return;
        }

        let guildId = interaction.guild.id;
        let player = players[guildId];
        let connecting = null;
        if (!player.playing) {
            connecting = player.connect(interaction.member.voice.channel);
        }

        let searchRes = null;
        let url = null;
        let id = null;
        let title = searchQuery;
        let searchString = searchQuery;

        let searchReply = interaction.reply({ content: strings.searchingFor + '' + searchString + '' });
        if (!searchQuery.startsWith('http')) {
            try {
                searchRes = await fastSearch(searchString, youtubeAPIKey);
                if (searchRes) {
                    url = searchRes.url;
                    id = searchRes.id;
                    title = searchRes.title;
                } else {
                    interaction.reply({ content: strings.noMatches, ephemeral: true});
                    return;
                }
            } catch (err) {
                debug(err);
                return;
            }
        } else {
            url = searchQuery;
        }

        let playlistIdRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^/\n\s]+\/\S+\/|(?:playlist|e(?:mbed)?\/videoseries)\/|\S*?\?list=)|youtu\.be\/)([a-zA-Z0-9_-]{34})/;
        if (playlistIdRegex.test(url)) {
            let playlistId = url.match(playlistIdRegex)[1];
            let playlist_callback = function(num) {
                interaction.reply({ content: ':white_check_mark: **Enqueued** `' + num + '` songs' });
            };
            if (!player.playing) {
                let customOpts = {
                    ...playlistOpts
                };
                customOpts.maxResults = 1;
                customOpts.part = 'snippet,contentDetails';
                let playlistRes = await playlistInfo(playlistId, customOpts);
                if (playlistRes) {
                    id = playlistRes.results[0].videoId;
                    url = 'https://www.youtube.com/watch?v=' + id;
                    title = playlistRes.results[0].title;
                }
                handlePlaylist(player, playlistId, interaction.member, true, playlist_callback);
            } else {
                handlePlaylist(player, playlistId, interaction.member, false, playlist_callback);
                return;
            }
        }

        if (!id) {
            id = getYTid(url);
        }

        let isYT = id != null;

        let pbP = handleVideo(id, interaction.member, url);
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
                    var prettyDuration = prettifyTime(pb.duration);
                    var timeUntilPlaying = await player.getTotalRemainingPlaybackTime();
                    var prettyTut = prettifyTime(timeUntilPlaying);
                    player.enqueue(pb);
                    embed = new MessageEmbed()
                        .setTitle(pb.title)
                        .setAuthor({ name: 'Added to queue', iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'})
                        .setURL(url)
                        .setThumbnail(pb.thumbnailURL)
                        .addField('Channel', pb.channelTitle)
                        .addField('Song Duration', prettyDuration)
                        .addField('Estimated time until playing', prettyTut)
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
    let idRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    let match = url.match(idRegex);

    if (match && match.length > 1) {
        return match[1];
    } else {
        return null;
    }
}

async function handleVideo(id, requester, url) {
    if (id) {
        let res = await videoInfo(id, videoOpts);
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
        return new PlaybackItem(url, requester, url, null, moment.duration('0'), null);
    }
}

async function handlePlaylist(player, id, requester, skip_first, callback) {
    let skipped = false;
    let page_info = null;
    let page_token = null;
    let k = 0;
    do {
        let res = await playlistInfo(id, playlistOpts, page_token);
        page_info = res.pageInfo;
        page_token = (page_info) ? page_info.nextPageToken : null;
        let items = res.results;

        for (let i of items) {
            if (skipped || !skip_first) {
                let video = handleVideo(i.videoId, requester);
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