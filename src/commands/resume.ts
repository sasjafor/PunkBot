import { ChatInputCommandInteraction, InteractionContextType } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { errorCode } from '../lib/errors.js';
import { LimitedDict } from '../lib/limitedDict.js';
import { logger } from '../lib/log.js';
import { PlaybackItem } from '../lib/playbackItem.js';
import { PlayerDict } from '../types.js';
import { strings } from '../lib/messageStrings.js';

const data = new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resumes playback.')
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

    const resume = player.resume();
    switch (resume) {
        case errorCode.OK:
        {
            interaction.editReply({ content: strings.resumed });
            break;
        }
        case errorCode.NOT_PLAYING:
        {
            interaction.editReply({ content: strings.nothingPlaying });
            break;
        }
        case errorCode.ALREADY_PLAYING:
        {
            interaction.editReply({ content: strings.alreadyPlaying });
            break;
        }
        default:
        {
            logger.error(`Unknown error with code ${resume}`);
            interaction.editReply({ content: strings.commandFailed });
        }
    }
}

export {
    data,
    execute,
};