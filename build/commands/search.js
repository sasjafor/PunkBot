import { ActionRowBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import unescape from 'lodash.unescape';
import { createPlayEmbed, playItem } from '../lib/playbackHelpers.js';
import { errorReply, handleYTVideo } from '../lib/util.js';
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
    .addStringOption(option => option.setName('query')
    .setDescription('YouTube link or search term.')
    .setRequired(true))
    .addIntegerOption(option => option.setName('count')
    .setDescription('How many results to show.')
    .setMinValue(0)
    .setMaxValue(25)
    .setRequired(false))
    .setDMPermission(false);
async function execute(interaction, players, youtubeAPIKey, youtubeCache, hasYoutubeCookies = false) {
    if (!interaction.inCachedGuild()) {
        logger.warn('Guild not cached!');
        return;
    }
    const searchQuery = interaction.options.getString('query');
    if (searchQuery === null) {
        logger.error('Search query was null!');
        return;
    }
    let count = interaction.options.getInteger('count');
    if (count === null) {
        count = 5;
    }
    const searchCount = Math.min(count, MAX_SEARCH_RESULTS);
    if (!interaction.member?.voice?.channel?.joinable) {
        errorReply(interaction, strings.noPermissionToConnect + interaction.member?.voice?.channel?.name);
        return;
    }
    const guildId = interaction.guild.id;
    const player = players[guildId];
    if (!player.isPlaying()) {
        player.connect(interaction.member?.voice?.channel);
    }
    const videoOpts = {
        q: searchQuery,
        key: youtubeAPIKey,
        part: 'snippet',
        type: 'video',
        maxResults: searchCount,
    };
    let res;
    try {
        res = await search(videoOpts);
        if (!res) {
            errorReply(interaction, strings.noMatches);
            return;
        }
    }
    catch (error) {
        logger.error(error);
        errorReply(interaction, searchQuery, error.response?.message);
        return;
    }
    const results = res?.results;
    if (results) {
        const videos = [];
        for (const element of results) {
            const title = unescape(element.title).substring(0, MAX_ENTRY_LENGTH);
            const channelTitle = unescape(element.channelTitle).substring(0, MAX_ENTRY_LENGTH);
            const option = new StringSelectMenuOptionBuilder()
                .setValue(element.id)
                .setLabel(title)
                .setDescription(channelTitle);
            videos.push(option);
        }
        const dropdown = new StringSelectMenuBuilder()
            .setCustomId(selectMenus.searchMenu)
            .setPlaceholder('Nothing selected')
            .setMinValues(1)
            .setMaxValues(1)
            .setOptions(videos);
        const actionRow = new ActionRowBuilder()
            .addComponents(dropdown);
        const message = await interaction.editReply({ components: [actionRow] });
        let selected = false;
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: DROPDOWN_TIMEOUT });
        collector.on('collect', async (i) => {
            await i.deferUpdate();
            if (i.customId !== selectMenus.searchMenu) {
                return;
            }
            selected = true;
            let pb;
            try {
                pb = await handleYTVideo(i.values[0], interaction.member, youtubeAPIKey);
            }
            catch (error) {
                logger.error(error);
                errorReply(interaction, searchQuery, error.response?.data?.error?.message, null);
                return;
            }
            const queued = await playItem(i, player, pb, youtubeCache, hasYoutubeCookies, searchQuery, false);
            const embed = await createPlayEmbed(pb, i.member?.displayAvatarURL(), queued, player);
            await i.editReply({ content: null, embeds: [embed] });
        });
        collector.on('end', _collected => {
            if (!selected) {
                message.delete();
            }
            else {
                message.edit({ components: [] });
            }
        });
    }
    else {
        throw new Error('Failed to search for videos');
    }
}
export { data, execute, };
//# sourceMappingURL=search.js.map