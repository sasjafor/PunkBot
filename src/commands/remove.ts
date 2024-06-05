import { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { LimitedDict } from '../lib/limitedDict.js';
import { logger } from '../lib/log.js';
import { PlaybackItem } from '../lib/playbackItem.js';
import { PlayerDict } from '../types.js';
import { strings } from '../lib/messageStrings.js';

const data = new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove the indicated track.')
    .setDMPermission(false)
    .addIntegerOption(option =>
        option.setName('index')
            .setDescription('Index to remove from queue.')
            .setRequired(true)
            .setMinValue(1));

async function execute(interaction: ChatInputCommandInteraction, players: PlayerDict, _youtubeAPIKey: string, _youtubeCache: LimitedDict<PlaybackItem>, _hasYoutubeCookies = false): Promise<void> {
    const index = interaction.options.getInteger('index');
    if (index === null) {
        return;
    }

    const guildId = interaction.guild?.id;
    if (guildId === undefined) {
        await interaction.editReply({ content: strings.unknownGuild });
        logger.error(strings.unknownGuild);
        return;
    }
    const player = players[guildId];

    if (!player.isConnected()) {
        interaction.editReply({ content: strings.notConnected });
        return;
    }

    const removedItem = player.remove(index);
    if (removedItem !== null) {
        interaction.editReply({ content: strings.removed + removedItem.title });
    } else {
        interaction.editReply({ content: strings.outOfRange });
    }
}

export {
    data,
    execute,
};