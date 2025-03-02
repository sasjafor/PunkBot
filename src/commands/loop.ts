import { ChatInputCommandInteraction, InteractionContextType } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { LimitedDict } from '../lib/limitedDict.js';
import { logger } from '../lib/log.js';
import { PlaybackItem } from '../lib/playbackItem.js';
import { PlayerDict } from '../types.js';
import { strings } from '../lib/messageStrings.js';

const data = new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggle looping of current track.')
    .setContexts(InteractionContextType.Guild);

async function execute(interaction: ChatInputCommandInteraction, players: PlayerDict, _youtubeAPIKey: string, _youtubeCache: LimitedDict<PlaybackItem>, _hasYoutubeCookies = false): Promise<void> {
    const guildId = interaction.guild?.id;
    if (guildId === undefined) {
        await interaction.editReply({ content: strings.unknownGuild });
        logger.error(strings.unknownGuild);
        return;
    }
    const player = players[guildId];

    const isLoop = player.switchLoop();
    if (isLoop) {
        interaction.editReply({ content: strings.loopEnabled });
    } else {
        interaction.editReply({ content: strings.loopDisabled });
    }
}

export {
    data,
    execute,
};