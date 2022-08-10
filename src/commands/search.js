import { ActionRowBuilder, ComponentType, SelectMenuBuilder, SelectMenuOptionBuilder } from 'discord.js';
import { AudioPlayerStatus } from '@discordjs/voice';
import decode from 'unescape';
import { SlashCommandBuilder } from '@discordjs/builders';

import { createPlayEmbed, playItem } from '../lib/playbackHelpers.js';
import { errorReply, handleVideo } from '../lib/util.js';
import { logger } from '../lib/log.js';
import { search } from '../lib/youtubeAPI.js';
import { selectMenus } from '../lib/componentIDs.js';
import { strings } from '../lib/messageStrings.js';

const DROPDOWN_TIMEOUT = 120000;
const MAX_SEARCH_RESULTS = 25; // discord limit
const MAX_ENTRY_LENGTH = 100; // discord limit

const data = new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search YouTube and show top 5 results.')
    .addStringOption(option =>
        option.setName('query')
            .setDescription('YouTube link or search term.')
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName('count')
            .setDescription('How many results to show.')
            .setMinValue(0)
            .setMaxValue(25)
            .setRequired(false))
    .setDMPermission(false);

async function execute(interaction, players, youtubeAPIKey, youtubeCache, hasYoutubeCookies = false) {
    let searchQuery = interaction.options.getString('query');
    let searchCount = Math.min(interaction.options.getInteger('count'), MAX_SEARCH_RESULTS);
    if (!interaction.member?.voice?.channel?.joinable) {
        errorReply(interaction, strings.noPermissionToConnect + interaction.member?.voice?.channel?.name);
        return;
    }

    let guildId = interaction.guild.id;
    let player = players[guildId];
    if (player?.dispatcher?.state?.status !== AudioPlayerStatus.Playing) {
        player.connect(interaction.member?.voice?.channel);
    }

    let videoOpts = {
        key: youtubeAPIKey,
        part: 'snippet',
        type: 'video',
        maxResults: searchCount || 5,
    };

    let res;
    try {
        res = await search(searchQuery, videoOpts, null);
        if (!res) {
            errorReply(interaction, strings.noMatches);
            return;
        }
    } catch (error) {
        logger.error(error);
        errorReply(interaction, searchQuery, error.response?.message);
        return;
    }
    let results = res?.results;

    if (results) {
        let videos = [];
        for (const element of results) {
            let title = decode(element.title).substring(0, MAX_ENTRY_LENGTH);
            let channelTitle = decode(element.channelTitle).substring(0, MAX_ENTRY_LENGTH);
            let option = new SelectMenuOptionBuilder()
                .setValue(element.id)
                .setLabel(title)
                .setDescription(channelTitle);
            videos.push(option);
        }

        const dropdown = new SelectMenuBuilder()
            .setCustomId(selectMenus.searchMenu)
            .setPlaceholder('Nothing selected')
            .setMinValues(1)
            .setMaxValues(1)
            .setOptions(videos);
        const actionRow = new ActionRowBuilder()
            .addComponents(
                dropdown,
            );

        let message = await interaction.editReply({components: [actionRow] });

        var selected = false;
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, time: DROPDOWN_TIMEOUT });
        collector.on('collect', async i => {
            await i.deferUpdate();
            if (i.customId !== selectMenus.searchMenu) {
                return;
            }
            selected = true;

            let pb = await handleVideo(i.values[0], interaction.member, null, null, youtubeAPIKey, null)
                .catch(async (error) => {
                    logger.error(error);
                    errorReply(interaction, searchQuery, error.response?.data?.error?.message, null);
                    return;
                });
            let queued = await playItem(i, player, pb, youtubeCache, hasYoutubeCookies, searchQuery, false);
            let embed = await createPlayEmbed(pb, i.member?.displayAvatarURL(), queued, player);
            await i.editReply({ content: null, embeds: [embed], components: null });
        });

        collector.on('end', _collected => {
            if (!selected) {
                message.delete();
            } else {
                message.edit({ components: [] });
            }
        });
    } else {
        throw new Error('Failed to search for videos');
    }
}

export {
    data,
    execute,
};