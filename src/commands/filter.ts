import { ChatInputCommandInteraction, InteractionContextType} from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { LimitedDict } from '../lib/limitedDict.js';
import { logger } from '../lib/log.js';
import { PlaybackItem } from '../lib/playbackItem.js';
import { PlayerDict } from '../types.js';
import { strings } from '../lib/messageStrings.js';

const data = new SlashCommandBuilder()
    .setName('filter')
    .setDescription('Set the audio filters.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption(option =>
        option.setName('filters')
            .setDescription('The audio filters that will be passed to ffmpeg.')
            .setRequired(true));

async function execute(interaction: ChatInputCommandInteraction, players: PlayerDict, _youtubeAPIKey: string, _youtubeCache: LimitedDict<PlaybackItem>, _hasYoutubeCookies = false): Promise<void> {
    const filters = interaction.options.getString('filters');
    if (filters === null) {
        return;
    }

    const guildId = interaction.guild?.id;
    if (guildId === undefined) {
        await interaction.editReply({ content: strings.unknownGuild });
        logger.error(strings.unknownGuild);
        return;
    }
    const player = players[guildId];

    await player.setFilters(filters);
    await interaction.editReply({ content: strings.filtersSet + filters });
}

export {
    data,
    execute,
};