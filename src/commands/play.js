const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const decode = require('unescape');
const moment = require('moment');
const Debug = require('debug');
const debug = Debug('punk_bot');
const debugv = Debug('punk_bot:verbose');
const debugd = Debug('punk_bot:debug');

const { players, youtubeAPIKey, youtubeCache } = require('../bot.js');
const { PlaybackItem } = require('../lib/playback-item.js');
const { strings } = require('../lib/strings.js');
const { prettifyTime } = require('../lib/util.js');
const { fastSearch,
        playlistInfo,
        playlistItems,
        videoInfo,
} = require('../lib/youtube-api.js');

var videoOpts = {
    key: youtubeAPIKey,
    part: 'contentDetails,snippet'
};

var playlistInfoOpts = {
    key: youtubeAPIKey,
    part: 'contentDetails,snippet',
};

var playlistOpts = {
    key: youtubeAPIKey,
    part: 'contentDetails,snippet',
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
        let url = searchQuery;
        let id = null;
        let title = searchQuery;
        let searchString = searchQuery;

        let searchEmbed = new MessageEmbed()
                    .setTitle(searchString)
                    .setAuthor({ name: 'Searching', iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'})
                    .setURL(url);
        let searchReply = interaction.reply({ embeds: [searchEmbed] });

        let playResult = 0;
        let pb = null;
        let queued = false;
        let pbCached = youtubeCache.get(searchString);
        if (pbCached) {
            pb = pbCached;
            pb.requesterName = interaction.member.displayName;
            pb.requesterId = interaction.user.id;
            pb.requesterIconURL = interaction.member.displayAvatarURL();

            if (!player.playing) {
                player.enqueue(pb);

                debugv('Added ' + url);
                await connecting;
                player.play();
            } else {
                queued = true;
                player.enqueue(pb);
            }
        } else {
            if (!searchQuery.startsWith('http')) {
                try {
                    searchRes = await fastSearch(searchString, youtubeAPIKey);
                    if (searchRes) {
                        url = searchRes.url;
                        id = searchRes.id;
                        title = searchRes.title;
                    } else {
                        interaction.editReply({ content: strings.noMatches, ephemeral: true});
                        return;
                    }
                } catch (err) {
                    debug(err);
                    return;
                }
            } else {
                let playlistIdRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^/\n\s]+\/\S+\/|(?:playlist|e(?:mbed)?\/videoseries)\/|\S*?\?list=)|youtu\.be\/)([a-zA-Z0-9_-]{34})/;
                if (playlistIdRegex.test(url)) {
                    let playlistId = url.match(playlistIdRegex)[1];
                    let playlistCallback = async function(num) {
                        let playlistInfoRes;
                        try {
                            playlistInfoRes = await playlistInfo(playlistId, playlistInfoOpts);
                        } catch(err) {
                            debug(err);
                        }
                        if (playlistInfoRes) {
                            let pi = playlistInfoRes.results[0];

                            let playlistEmbed = new MessageEmbed()
                                .setTitle(pi.title)
                                .setAuthor({ name: 'Enqueued playlist', iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot' })
                                .setURL(url)
                                .setThumbnail(pb.thumbnailURL)
                                .addField('Channel', pi.channelTitle)
                                .addField('Enqueued Items', String(num));
                            interaction.channel.send({ embeds: [playlistEmbed] });
                        }
                    };
                    if (!player.playing) {
                        let customOpts = {
                            ...playlistOpts
                        };
                        customOpts.maxResults = 1;
                        customOpts.part = 'snippet,contentDetails';
                        let playlistRes = null;
                        try {
                            playlistRes = await playlistItems(playlistId, customOpts);
                        } catch(err) {
                            if (err.response?.status == 404) {
                                await searchReply;
                                let failEmbed = new MessageEmbed()
                                        .setTitle(searchString)
                                        .setAuthor({ name: 'Playlist not found or private', iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'})
                                        .setURL(url);
                                await interaction.editReply({ embeds: [failEmbed], ephemeral: true });
                            }
                            return;
                        }
                        if (playlistRes) {
                            id = playlistRes.results[0].videoId;
                            url = 'https://www.youtube.com/watch?v=' + id;
                            title = playlistRes.results[0].title;
                        }
                        handlePlaylist(player, playlistId, interaction.member, true, playlistCallback);
                    } else {
                        handlePlaylist(player, playlistId, interaction.member, false, playlistCallback);
                        return;
                    }
                }
            }

            if (!id) {
                id = getYTid(url);
            }
            let isYT = id != null;

            if (!isYT) {
                let fileNameRegex = /\/([\w\-. ]+)\.[\w\- ]+$/;
                let matches = searchQuery.match(fileNameRegex);
                if (matches) {
                    title = matches[1];
                }
            }

            let pbP = handleVideo(id, interaction.member, url, title);
            if (!player.playing) {
                let pb_short = new PlaybackItem(url, interaction.member.displayName, interaction.user.id, interaction.member.displayAvatarURL(), title);
                player.enqueue(pb_short);

                debugv('Added ' + url);
                await connecting;
                playResult = player.play();

                pb = await pbP;
                pb_short.title = pb.title;
                pb_short.duration = pb.duration;
                pb_short.thumbnailURL = pb.thumbnailURL;
                pb_short.channelTitle = pb.channelTitle;
            } else {
                queued = true;
                pb = await pbP;
                player.enqueue(pb);
            }
            pb.isYT = isYT;

            if (isYT) {
                youtubeCache.push(searchQuery, pb);
            }
        }
        
        // youtubeCache.printlist();
        playResult = await playResult;
        if (playResult == -1) {
            await searchReply;
            let failEmbed = new MessageEmbed()
                    .setTitle(searchString)
                    .setAuthor({ name: 'Failed to create stream for your request, try again!', iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'})
                    .setURL(url);
            interaction.editReply({ embeds: [failEmbed], ephemeral: true });
        } else {
            let embed = null;
            if (pb) {
                if (pb.isYT) {
                    var prettyDuration = prettifyTime(pb.duration);
                    embed = new MessageEmbed()
                        .setTitle(decode(pb.title))
                        .setAuthor({ name: 'Playing', iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'})
                        .setURL(pb.url)
                        .setThumbnail(pb.thumbnailURL)
                        .addField('Channel', pb.channelTitle)
                        .addField('Song Duration', prettyDuration);

                    if (queued) {
                        let timeUntilPlaying = await player.getTotalRemainingPlaybackTime();
                        let prettyTut = prettifyTime(timeUntilPlaying);
                        embed = embed.setAuthor({ name: 'Added to queue', iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'})
                                    .addField('Estimated time until playing', prettyTut)
                                    .addField('Position in queue', String(player.queue.getLength()));
                    }
                } else {
                    //TODO: embed for non youtube links
                    embed = new MessageEmbed()
                        .setTitle(decode(pb.title))
                        .setAuthor({ name: 'Playing', iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'})
                        .setURL(pb.url);

                    if (queued) {
                        let timeUntilPlaying = await player.getTotalRemainingPlaybackTime();
                        let prettyTut = prettifyTime(timeUntilPlaying);
                        embed = embed.setAuthor({ name: 'Added to queue', iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'})
                                    .addField('Estimated time until playing', prettyTut)
                                    .addField('Position in queue', String(player.queue.getLength()));
                    }
                }
            }

            if (embed) {
                await searchReply;
                interaction.editReply({ content: null, embeds: [embed] });
            }
        }
	},
};

/**
 * @param {string} url
 */
function getYTid(url) {
    let idRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    let match = url.match(idRegex);

    if (match && match.length > 1) {
        return match[1];
    } else {
        return null;
    }
}

/**
 * @param {string} id
 * @param {{displayName: any;user: {id: any;};displayAvatarURL: () => any;}} requester
 * @param {string} url
 * @param {string | undefined} [title]
 */
async function handleVideo(id, requester, url, title) {
    if (id) {
        let res = await videoInfo(id, videoOpts);
        res = res.results[0];

        if (res) {
            let ytUrl = 'https://www.youtube.com/watch?v=' + id;
            let ytTitle = res.title;
            let ytThumbnailURL = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
            let ytDuration = moment.duration(res.duration);
            let ytChannelTitle = res.channelTitle;
            return new PlaybackItem(ytUrl, requester.displayName, requester.user.id, requester.displayAvatarURL(), ytTitle, ytThumbnailURL, ytDuration, ytChannelTitle);
        } else {
            throw new Error('Failed to get video info');
        }
    } else {
        return new PlaybackItem(url, requester.displayName, requester.user.id, requester.displayAvatarURL(), title, null, moment.duration('0'), null);
    }
}

/**
 * @param {{ enqueue: (arg0: PlaybackItem) => void; }} player
 * @param {any} id
 * @param {{ displayName: any; user: { id: any; }; displayAvatarURL: () => any; }} requester
 * @param {boolean} skip_first
 * @param {{ (num: any): void; (num: any): void; (arg0: number): void; }} callback
 */
async function handlePlaylist(player, id, requester, skip_first, callback) {
    let skipped = false;
    let page_info = null;
    let page_token = null;
    let k = 0;
    do {
        let res = await playlistItems(id, playlistOpts, page_token);
        page_info = res.pageInfo;
        page_token = (page_info) ? page_info.nextPageToken : null;
        let items = res.results;

        for (let i of items) {
            if (skipped || !skip_first) {
                let YTurl = 'https://www.youtube.com/watch?v=' + i.videoId;
                let video = await handleVideo(i.videoId, requester, YTurl);
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