import { ChatInputCommandInteraction, InteractionContextType } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { errorCode } from '../lib/errors.js';
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
        case errorCode.OK:
        {
            interaction.editReply({ content: strings.paused });
            break;
        }
        case errorCode.NOT_PLAYING:
        {
            interaction.editReply({ content: strings.nothingPlaying });
            break;
        }
        case errorCode.ALREADY_PAUSED:
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