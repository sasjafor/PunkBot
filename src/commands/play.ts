import moment from 'moment';

import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { BasicVideoInfo, PlayerDict } from '../types.js';
import { createPlayEmbed, playItem } from '../lib/playbackHelpers.js';
import { errorReply,
         getAudioDurationInSeconds,
         getSeekTime,
         getYTid,
         handleAudioResource,
         handleYTPlaylist,
         handleYTVideo } from '../lib/util.js';
import { fastSearch,
         playlistInfo,
         playlistItems } from '../lib/youtubeAPI.js';
import { LimitedDict } from '../lib/limitedDict.js';
import { logger } from '../lib/log.js';
import { PlaybackItem } from '../lib/playbackItem.js';
import { Player } from '../lib/player.js';
import { strings } from '../lib/messageStrings.js';

const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a YouTube video.')
    .setDMPermission(false)
    .addStringOption(option =>
        option.setName('query')
            .setDescription('YouTube link or search term.')
            .setRequired(true))
    .addBooleanOption(option =>
        option.setName('silent')
            .setDescription('Execute command silently.'))
    .addBooleanOption(option =>
        option.setName('next')
            .setDescription('Play next, in front of queue.'));

async function execute(interaction: ChatInputCommandInteraction, players: PlayerDict, youtubeAPIKey: string, youtubeCache: LimitedDict<PlaybackItem>, hasYoutubeCookies = false): Promise<void> {
    if (interaction.guild === null) {
        return;
    }

    if (!interaction.inCachedGuild()) {
        logger.warn('Guild not cached!');
        return;
    }

    const searchQuery = interaction.options.getString('query');
    if (searchQuery === null) {
        return;
    }

    if (!interaction.member?.voice?.channel?.joinable) {
        errorReply(interaction, strings.noPermissionToConnect + interaction.member?.voice?.channel?.name);
        return;
    }

    let doPlayNext = interaction.options.getBoolean('next');
    if (doPlayNext === null) {
        doPlayNext = false;
    }

    const guildId = interaction.guild.id;
    const player = players[guildId];
    if (!player.isPlaying()) {
        player.connect(interaction.member?.voice?.channel);
    }

    let playlist = false;

    let pb = null;
    const pbCached = youtubeCache.get(searchQuery);
    if (pbCached) {
        pb = pbCached;
        pb.requesterName = interaction.member?.displayName;
        pb.requesterId = interaction.user.id;
        pb.requesterIconURL = interaction.member?.displayAvatarURL();
    } else {
        let id: string | null;
        let url: string = '';
        let title = url;
        let duration = moment.duration(0);
        let seekTime = 0;

        if (searchQuery.startsWith('http')) {
            url = searchQuery;

            const playlistIdRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:playlist|e(?:mbed)?\/videoseries)\/|\S*?[\?\&]list=)|youtu\.be\/)([a-zA-Z0-9_-]{18,34})/;
            if (playlistIdRegex.test(url)) {
                playlist = true;
                const match = url.match(playlistIdRegex);
                if (match === null) {
                    return;
                }
                const playlistId = match[1];
                const playlistRes = await processPlaylist(playlistId, youtubeAPIKey, interaction, url, player);
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
                    const fileNameRegex = /\/([\w\-. ]+)\.[\w\- ]+$/;
                    const matches = url.match(fileNameRegex);
                    if (matches) {
                        title = matches[1];
                    }

                    duration = moment.duration(await getAudioDurationInSeconds(url), 'seconds');
                } else {
                    seekTime = getSeekTime(url);
                }
            }
        } else {
            try {
                const searchRes = await fastSearch(searchQuery, youtubeAPIKey);
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

        if (id === null) {
            pb = handleAudioResource(interaction.member, url, title, duration, seekTime);
        } else {
            try {
                pb = await handleYTVideo(id, interaction.member, youtubeAPIKey, seekTime);
            } catch(error) {
                logger.error(error);
                errorReply(interaction, searchQuery, error.response?.data?.error?.message, url);
                return;
            }
        }
    }

    const queued = await playItem(interaction, player, pb, youtubeCache, hasYoutubeCookies, searchQuery, playlist, doPlayNext);
    if (queued === -1) {
        return;
    }
    const embed = await createPlayEmbed(pb, interaction.member?.displayAvatarURL(), queued, player);

    await interaction.editReply({ content: null, embeds: [embed] });
}

async function processPlaylist(playlistId: string, youtubeAPIKey: string, interaction: ChatInputCommandInteraction, url: string, player: Player): Promise<BasicVideoInfo | null> {
    if (interaction.channel === null) {
        logger.warn('Interaction not sent in a channel.');
        return null;
    }

    if (!interaction.inCachedGuild()) {
        logger.warn('Guild not cached!');
        return null;
    }

    const playlistCallback = async function (successCount: number, _failCount: number): Promise<undefined> {
        let playlistInfoRes;
        try {
            const playlistInfoOpts = {
                id: playlistId,
                key: youtubeAPIKey,
                part: 'contentDetails,snippet',
            };
            playlistInfoRes = await playlistInfo(playlistInfoOpts);
        } catch (error) {
            logger.error(error);
            errorReply(interaction, url, error.response?.data?.error?.message, url);
            return;
        }
        const pi = playlistInfoRes.results[0];

        const playlistEmbed = new EmbedBuilder()
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

    if (!player.isPlaying()) {
        const playlistOpts = {
            id: playlistId,
            key: youtubeAPIKey,
            part: 'contentDetails,snippet',
            maxResults: 1,
        };
        let playlistRes = null;
        try {
            playlistRes = await playlistItems(playlistOpts);
        } catch (error) {
            logger.error(error);
            errorReply(interaction, url, error.response?.data?.error?.message, url);
            return null;
        }
        let res = null;
        if (playlistRes) {
            const id = playlistRes.results[0].videoId;

            res = {
                id: id,
                url: 'https://www.youtube.com/watch?v=' + id,
                title: playlistRes.results[0].title,
            };
        }
        handleYTPlaylist(player, playlistId, interaction.member, true, playlistCallback, interaction.channel, interaction.member?.displayAvatarURL(), youtubeAPIKey);
        return res;
    } else {
        handleYTPlaylist(player, playlistId, interaction.member, false, playlistCallback, interaction.channel, interaction.member?.displayAvatarURL(), youtubeAPIKey);
        return null;
    }
}

export {
    data,
    execute,
};