import { ChatInputCommandInteraction, InteractionContextType } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { ErrorCode } from '../lib/errors.js';
import { LimitedDict } from '../lib/limitedDict.js';
import { logger } from '../lib/log.js';
import { PlaybackItem } from '../lib/playbackItem.js';
import { PlayerDict } from '../types.js';
import { strings } from '../lib/messageStrings.js';

const data = new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pauses playback.')
    .setContexts(InteractionContextType.Guild);

async function execute(interaction: ChatInputCommandInteraction, players: PlayerDict, _youtubeAPIKey: string, _youtubeCache: LimitedDict<PlaybackItem>, _hasYoutubeCookies = false): Promise<void> {
    const guildId = interaction.guild?.id;
    if (guildId === undefined) {
        interaction.editReply({ content: strings.unknownGuild });
        logger.error(strings.unknownGuild);
        return;
    }
    const player = players[guildId];

    if (!player.isConnected()) {
        interaction.editReply({ content: strings.notConnected });
        return;
    }

    const pause = player.pause();
    switch (pause) {
        case ErrorCode.OK:
        {
            interaction.editReply({ content: strings.paused });
            break;
        }
        case ErrorCode.NOT_PLAYING:
        {
            interaction.editReply({ content: strings.nothingPlaying });
            break;
        }
        case ErrorCode.ALREADY_PAUSED:
        {
            interaction.editReply({ content: strings.alreadyPaused });
            break;
        }
        default:
        {
            logger.error(`Unknown error with code ${pause}`);
            interaction.editReply({ content: strings.commandFailed });
        }
    }
}

export {
    data,
    execute,
};