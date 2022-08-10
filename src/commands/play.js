import moment from 'moment';

import { AudioPlayerStatus } from '@discordjs/voice';
import { EmbedBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { createPlayEmbed, playItem } from '../lib/playbackHelpers.js';
import { errorReply,
         getAudioDurationInSeconds,
         getYTid,
         handlePlaylist,
         handleVideo } from '../lib/util.js';
import { fastSearch,
         playlistInfo,
         playlistItems } from '../lib/youtubeAPI.js';
import { logger } from './../lib/log.js';
import { strings } from '../lib/messageStrings.js';

const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a YouTube video.')
    .addStringOption(option =>
        option.setName('query')
            .setDescription('YouTube link or search term.')
            .setRequired(true))
    .setDMPermission(false);

async function execute(interaction, players, youtubeAPIKey, youtubeCache, hasYoutubeCookies = false) {
    let searchQuery = interaction.options.getString('query');
    if (!interaction.member?.voice?.channel?.joinable) {
        errorReply(interaction, strings.noPermissionToConnect + interaction.member?.voice?.channel?.name);
        return;
    }

    let guildId = interaction.guild.id;
    let player = players[guildId];
    if (player?.dispatcher?.state?.status !== AudioPlayerStatus.Playing) {
        player.connect(interaction.member?.voice?.channel);
    }

    let playlist = false;

    let pb = null;
    let pbCached = youtubeCache.get(searchQuery);
    if (pbCached) {
        pb = pbCached;
        pb.requesterName = interaction.member?.displayName;
        pb.requesterId = interaction.user.id;
        pb.requesterIconURL = interaction.member?.displayAvatarURL();
    } else {
        let id = null;
        let url = null;
        let title = null;
        let duration = null;

        if (searchQuery.startsWith('http')) {
            url = searchQuery;

            let playlistIdRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:playlist|e(?:mbed)?\/videoseries)\/|\S*?\?list=)|youtu\.be\/)([a-zA-Z0-9_-]{34})/;
            if (playlistIdRegex.test(url)) {
                playlist = true;
                let playlistId = url.match(playlistIdRegex)[1];
                let playlistRes = await processPlaylist(playlistId, youtubeAPIKey, interaction, url, player);
                if (playlistRes) {
                    id = playlistRes.id;
                    url = playlistRes.url;
                    title = playlistRes.title;
                } else {
                    return;
                }
            } else {
                id = getYTid(url);
                if (!id) {
                    let fileNameRegex = /\/([\w\-. ]+)\.[\w\- ]+$/;
                    let matches = url.match(fileNameRegex);
                    if (matches) {
                        title = matches[1];
                    }

                    duration = moment.duration(await getAudioDurationInSeconds(url), 'seconds');
                }
            }
        } else {
            try {
                let searchRes = await fastSearch(searchQuery, youtubeAPIKey);
                if (searchRes) {
                    id = searchRes.id;
                    url = searchRes.url;
                    title = searchRes.title;
                } else {
                    errorReply(interaction, strings.noMatches);
                    return;
                }
            } catch (error) {
                logger.error(error);
                errorReply(interaction, searchQuery, error.response?.message);
                return;
            }
        }

        pb = await handleVideo(id, interaction.member, url, title, youtubeAPIKey, duration)
            .catch(async (error) => {
                logger.error(error);
                errorReply(interaction, searchQuery, error.response?.data?.error?.message, url);
                return;
            });
    }

    let queued = await playItem(interaction, player, pb, youtubeCache, hasYoutubeCookies, searchQuery, playlist);
    if (queued === -1) {
        return;
    }
    let embed = await createPlayEmbed(pb, interaction.member?.displayAvatarURL(), queued, player);

    await interaction.editReply({ content: null, embeds: [embed] });
}

async function processPlaylist(playlistId, youtubeAPIKey, interaction, url, player) {
    let playlistCallback = async function (successCount, _failCount) {
        let playlistInfoRes;
        try {
            let playlistInfoOpts = {
                key: youtubeAPIKey,
                part: 'contentDetails,snippet',
            };
            playlistInfoRes = await playlistInfo(playlistId, playlistInfoOpts);
        } catch (error) {
            logger.error(error);
            errorReply(interaction, url, error.response?.data?.error?.message, url);
            return;
        }
        let pi = playlistInfoRes.results[0];

        let playlistEmbed = new EmbedBuilder()
            .setTitle(pi.title)
            .setAuthor({ name: 'Enqueued playlist', iconURL: interaction.member?.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot' })
            .setURL(url)
            .setThumbnail(pi.thumbnails?.maxres?.url)
            .addFields([{ name: 'Channel', value: pi.channelTitle },
                        { name: 'Enqueued Items', value: successCount + '/' + pi.itemCount }]);
        if (interaction.isRepliable() && !interaction.replied) {
            interaction.editReply({ embeds: [playlistEmbed] });
        } else {
            interaction.channel?.send({ embeds: [playlistEmbed] });
        }
    };
    if (player?.dispatcher?.state?.status !== AudioPlayerStatus.Playing) {
        let playlistOpts = {
            key: youtubeAPIKey,
            part: 'contentDetails,snippet',
            maxResults: 1,
        };
        let playlistRes = null;
        try {
            playlistRes = await playlistItems(playlistId, playlistOpts, null, null);
        } catch (error) {
            logger.error(error);
            errorReply(interaction, url, error.response?.data?.error?.message, url);
            return;
        }
        let res;
        if (playlistRes) {
            let id = playlistRes.results[0].videoId;

            res = {
                id: id,
                url: 'https://www.youtube.com/watch?v=' + id,
                title: playlistRes.results[0].title,
            };
        }
        handlePlaylist(player, playlistId, interaction.member, true, playlistCallback, interaction.channel, interaction.member?.displayAvatarURL(), youtubeAPIKey);
        return res;
    } else {
        handlePlaylist(player, playlistId, interaction.member, false, playlistCallback, interaction.channel, interaction.member?.displayAvatarURL(), youtubeAPIKey);
        return;
    }
}

export {
    data,
    execute,
};