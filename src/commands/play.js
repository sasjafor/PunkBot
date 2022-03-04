import Debug from 'debug';
import decode from 'unescape';

import { MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { errorReply, getYTid, handlePlaylist, handleVideo, prettifyTime } from '../lib/util.js';
import { fastSearch,
         playlistInfo,
         playlistItems,
} from '../lib/youtubeAPI.js';
import { PlaybackItem } from '../lib/playbackItem.js';
import { strings } from '../lib/strings.js';

// eslint-disable-next-line no-unused-vars
const debug = Debug('punk_bot');
const debugv = Debug('punk_bot:verbose');
// eslint-disable-next-line no-unused-vars
const debugd = Debug('punk_bot:debug');

var playlistInfoOpts = {
    part: 'contentDetails,snippet',
};

const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a YouTube video.')
    .addStringOption(option =>
        option.setName('search')
            .setDescription('YouTube link or search term.')
            .setRequired(true));

async function execute(interaction, players, youtubeAPIKey, youtubeCache) {
    let searchQuery = interaction.options.getString('search');
    if (!interaction.member?.voice?.channel?.joinable) {
        errorReply(interaction, strings.noPermissionToConnect + interaction.member?.voice?.channel?.name);
        return;
    }

    let guildId = interaction.guild.id;
    let player = players[guildId];
    let connecting = null;
    if (!player.playing) {
        connecting = player.connect(interaction.member?.voice?.channel);
    }

    let searchRes = null;
    let url = null;
    let id = null;
    let title = searchQuery;
    let searchString = searchQuery;

    let searchEmbed = new MessageEmbed()
        .setTitle(searchString)
        .setAuthor({ name: 'Searching', iconURL: interaction.member?.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'})
        .setURL(url);
    let searchReply = interaction.reply({ embeds: [searchEmbed] });

    let playResult = 0;
    let pb = null;
    let queued = false;
    let playlist = false;
    let pbCached = youtubeCache.get(searchString);
    if (pbCached) {
        pb = pbCached;
        pb.requesterName = interaction.member?.displayName;
        pb.requesterId = interaction.user.id;
        pb.requesterIconURL = interaction.member?.displayAvatarURL();

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
                        playlistInfoOpts.key = youtubeAPIKey;
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
                        .setAuthor({ name: 'Enqueued playlist', iconURL: interaction.member?.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot' })
                        .setURL(url)
                        .setThumbnail(pi.thumbnails?.maxres?.url)
                        .addField('Channel', pi.channelTitle)
                        .addField('Enqueued Items', successCount + '/' + pi.itemCount);
                    interaction.channel?.send({ embeds: [playlistEmbed] });
                };
                if (!player.playing) {
                    let playlistOpts = {
                        key: youtubeAPIKey,
                        part: 'contentDetails,snippet',
                        maxResults: 50,
                    };
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
                    handlePlaylist(player, playlistId, interaction.member, true, playlistCallback, interaction.channel, interaction.member?.displayAvatarURL());
                } else {
                    handlePlaylist(player, playlistId, interaction.member, false, playlistCallback, interaction.channel, interaction.member?.displayAvatarURL());
                    return;
                }
            }
        }

        if (!id) {
            id = getYTid(url);
        }
        let isYT = !!id;

        if (!isYT) {
            let fileNameRegex = /\/([\w\-. ]+)\.[\w\- ]+$/;
            let matches = searchQuery.match(fileNameRegex);
            if (matches) {
                title = matches[1];
            }
        }

        let pbP = handleVideo(id, interaction.member, url, title, youtubeAPIKey)
            .catch(async (error) => {
                console.trace(error.name + ': ' + error.message);
                await searchReply;
                errorReply(interaction, searchString, error.response?.data?.error?.message, url);
                return;
            });
        if (!player.playing) {
            let pbShort = new PlaybackItem(url, interaction.member?.displayName, interaction.user.id, interaction.member?.displayAvatarURL(), title);
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
}

export {
    data,
    execute,
};