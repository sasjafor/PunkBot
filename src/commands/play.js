const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const decode = require('unescape');
const moment = require('moment');
const Debug = require('debug');
// eslint-disable-next-line no-unused-vars
const debug = Debug('punk_bot');
const debugv = Debug('punk_bot:verbose');
const debugd = Debug('punk_bot:debug');

const { players, youtubeAPIKey, youtubeCache } = require('../bot.js');
const { PlaybackItem } = require('../lib/playback-item.js');
const { strings } = require('../lib/strings.js');
const { prettifyTime, errorReply } = require('../lib/util.js');
const { fastSearch,
        playlistInfo,
        playlistItems,
        videoInfo,
} = require('../lib/youtube-api.js');

var videoOpts = {
    key: youtubeAPIKey,
    part: 'contentDetails,snippet',
};

var playlistInfoOpts = {
    key: youtubeAPIKey,
    part: 'contentDetails,snippet',
};

var playlistOpts = {
    key: youtubeAPIKey,
    part: 'contentDetails,snippet',
    maxResults: 50,
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
        if (!interaction.member.voice.channel.joinable) {
            errorReply(interaction, strings.noPermissionToConnect + interaction.member.voice.channel.name);
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

        let searchEmbed = new MessageEmbed()
            .setTitle(searchString)
            .setAuthor({ name: 'Searching', iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'})
            .setURL(url);
        let searchReply = interaction.reply({ embeds: [searchEmbed] });

        let playResult = 0;
        let pb = null;
        let queued = false;
        let playlist = false;
        let pbCached = youtubeCache.get(searchString);
        if (pbCached) {
            pb = pbCached;
            pb.requesterName = interaction.member.displayName;
            pb.requesterId = interaction.user.id;
            pb.requesterIconURL = interaction.member.displayAvatarURL();

            if (!player.playing) {
                player.enqueue(pb);

                debugv('Added ' + pb.url);
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
                        await searchReply;
                        errorReply(interaction, strings.noMatches);
                        return;
                    }
                } catch(error) {
                    console.trace(error.name + ': ' + error.message);
                    errorReply(interaction, searchString, error.response?.message);
                    return;
                }
            } else {
                url = searchQuery;
                let playlistIdRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^/\n\s]+\/\S+\/|(?:playlist|e(?:mbed)?\/videoseries)\/|\S*?\?list=)|youtu\.be\/)([a-zA-Z0-9_-]{34})/;
                if (playlistIdRegex.test(url)) {
                    playlist = true;
                    let playlistId = url.match(playlistIdRegex)[1];
                    let playlistCallback = async function(successCount, _failCount) {
                        let playlistInfoRes;
                        try {
                            playlistInfoRes = await playlistInfo(playlistId, playlistInfoOpts);
                        } catch(error) {
                            console.trace(error.name + ': ' + error.message);
                            await searchReply;
                            errorReply(interaction, searchString, error.response?.data?.error?.message, url);
                            return;
                        }
                        let pi = playlistInfoRes.results[0];

                        let playlistEmbed = new MessageEmbed()
                            .setTitle(pi.title)
                            .setAuthor({ name: 'Enqueued playlist', iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot' })
                            .setURL(url)
                            .setThumbnail(pi.thumbnails.maxres.url)
                            .addField('Channel', pi.channelTitle)
                            .addField('Enqueued Items', successCount + '/' + pi.itemCount);
                        interaction.channel.send({ embeds: [playlistEmbed] });
                    };
                    if (!player.playing) {
                        let customOpts = {
                            ...playlistOpts,
                        };
                        customOpts.maxResults = 1;
                        customOpts.part = 'snippet,contentDetails';
                        let playlistRes = null;
                        try {
                            playlistRes = await playlistItems(playlistId, customOpts, null, null);
                        } catch(error) {
                            console.trace(error.name + ': ' + error.message);
                            await searchReply;
                            errorReply(interaction, searchString, error.response?.data?.error?.message, url);
                            return;
                        }
                        if (playlistRes) {
                            id = playlistRes.results[0].videoId;
                            url = 'https://www.youtube.com/watch?v=' + id;
                            title = playlistRes.results[0].title;
                        }
                        handlePlaylist(player, playlistId, interaction.member, true, playlistCallback, interaction.channel, interaction.member.displayAvatarURL());
                    } else {
                        handlePlaylist(player, playlistId, interaction.member, false, playlistCallback, interaction.channel, interaction.member.displayAvatarURL());
                        return;
                    }
                }
            }

            if (!id) {
                id = getYTid(url);
            }
            let isYT = id !== null;

            if (!isYT) {
                let fileNameRegex = /\/([\w\-. ]+)\.[\w\- ]+$/;
                let matches = searchQuery.match(fileNameRegex);
                if (matches) {
                    title = matches[1];
                }
            }

            let pbP = handleVideo(id, interaction.member, url, title)
                .catch(async (error) => {
                    console.trace(error.name + ': ' + error.message);
                    await searchReply;
                    errorReply(interaction, searchString, error.response?.data?.error?.message, url);
                    return;
                });
            if (!player.playing) {
                let pbShort = new PlaybackItem(url, interaction.member.displayName, interaction.user.id, interaction.member.displayAvatarURL(), title);
                player.enqueue(pbShort);

                debugv('Added ' + url);
                await connecting;
                playResult = player.play();

                pb = await pbP;
                if (!pb) {
                    return;
                }
                pbShort.title = pb.title;
                pbShort.duration = pb.duration;
                pbShort.thumbnailURL = pb.thumbnailURL;
                pbShort.channelTitle = pb.channelTitle;
            } else {
                queued = true;
                pb = await pbP;
                if (!pb) {
                    return;
                }
                player.enqueue(pb);
            }
            pb.isYT = isYT;

            if (isYT && !playlist) {
                youtubeCache.push(searchQuery, pb);
            }
        }
        
        playResult = await playResult;
        if (playResult === -1) {
            await searchReply;
            errorReply(interaction, searchString, 'Failed to create stream for your request, try again!', url);
            return;
        }
            
        if (!pb) {
            return;
        }
        var prettyDuration = prettifyTime(pb.duration);
        let embed = new MessageEmbed()
            .setTitle(decode(pb.title))
            .setAuthor({ name: 'Playing', iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'})
            .setURL(pb.url);

        if (pb.isYT) {
            embed = embed.setThumbnail(pb.thumbnailURL)
                .addField('Channel', pb.channelTitle)
                .addField('Song Duration', prettyDuration);
        }

        if (queued) {
            let timeUntilPlaying = await player.getTotalRemainingPlaybackTime();
            let prettyTut = prettifyTime(timeUntilPlaying);
            embed = embed.setAuthor({ name: 'Added to queue', iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'})
                .addField('Estimated time until playing', prettyTut)
                .addField('Position in queue', String(player.queue.getLength()));
        }

        await searchReply;
        interaction.editReply({ content: null, embeds: [embed] });
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
        let res;
        res = await videoInfo(id, videoOpts, null);
        res = res.results[0];

        if (res) {
            let ytUrl = 'https://www.youtube.com/watch?v=' + id;
            let ytTitle = res.title;
            let ytThumbnailURL = res.thumbnails.maxres.url;
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
 * @param {boolean} skipFirst
 */
async function handlePlaylist(player, id, requester, skipFirst, callback, channel, avatarURL) {
    let skipped = false;
    let pageInfo = null;
    let pageToken = null;
    let successCount = 0;
    if (skipFirst) {
        successCount++;
    }
    let failCount = 0;
    do {
        let res;
        try {
            res = await playlistItems(id, playlistOpts, pageToken, null);
        } catch(error) {
            console.trace(error.name + ': ' + error.message);
            let url = 'https://www.youtube.com/playlist?list=' + id;
            errorReply(undefined, url, error.response?.data?.error?.message, url, channel, avatarURL);
            return null;
        }
        pageInfo = res.pageInfo;
        pageToken = (pageInfo) ? pageInfo.nextPageToken : null;
        let items = res.results;

        for (let i of items) {
            if (skipped || !skipFirst) {
                let YTurl = 'https://www.youtube.com/watch?v=' + i.videoId;
                let video = await handleVideo(i.videoId, requester, YTurl).catch((error) => {
                    console.trace(error.name + ': ' + error.message);
                });
                if (video) {
                    successCount++;
                    player.enqueue(video);
                } else {
                    failCount++;
                }
            }
            skipped = true;
        }
    } while (pageInfo.nextPageToken);
    debugd('DONE processing playlist!');
    if (callback) {
        callback(successCount, failCount);
    }
}