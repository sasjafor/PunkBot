import { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { LimitedDict } from '../lib/limitedDict.js';
import { logger } from '../lib/log.js';
import { PlaybackItem } from '../lib/playbackItem.js';
import { PlayerDict } from '../types.js';
import { strings } from '../lib/messageStrings.js';

const data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips the current song.')
    .setDMPermission(false);

async function execute(interaction: ChatInputCommandInteraction, players: PlayerDict, _youtubeAPIKey: string, _youtubeCache: LimitedDict<PlaybackItem>, _hasYoutubeCookies = false): Promise<void> {
    const guildId = interaction.guild?.id;
    if (guildId === undefined) {
        await interaction.editReply({ content: strings.unknownGuild });
        logger.error(strings.unknownGuild);
        return;
    }
    const player = players[guildId];

    if (!player.isConnected()) {
        await interaction.editReply({ content: strings.notConnected });
        return;
    }

    const skipName = player.skip();
    const nowPlaying = player.getNowPlaying();
    if (skipName !== null) {
        let resString = strings.skipped + '`' + skipName + '`';
        if (nowPlaying) {
            resString += '\n:arrow_forward: **Playing**  ' + '`' + nowPlaying.title + '`';
        }
        await interaction.editReply({ content: resString });
    } else {
        await interaction.editReply({ content: strings.nothingPlaying });
    }
}

export {
    data,
    execute,
};