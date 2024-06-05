import { ChatInputCommandInteraction} from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { LimitedDict } from '../lib/limitedDict.js';
import { logger } from '../lib/log.js';
import { PlaybackItem } from '../lib/playbackItem.js';
import { PlayerDict } from '../types.js';
import { strings } from '../lib/messageStrings.js';

const data = new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the playback volume.')
    .setDMPermission(false)
    .addNumberOption(option =>
        option.setName('value')
            .setDescription('Volume to set.')
            .setRequired(true)
            .setMinValue(0));

async function execute(interaction: ChatInputCommandInteraction, players: PlayerDict, _youtubeAPIKey: string, _youtubeCache: LimitedDict<PlaybackItem>, _hasYoutubeCookies = false): Promise<void> {
    const value = interaction.options.getNumber('value');
    if (value === null) {
        return;
    }

    const guildId = interaction.guild?.id;
    if (guildId === undefined) {
        await interaction.editReply({ content: strings.unknownGuild });
        logger.error(strings.unknownGuild);
        return;
    }
    const player = players[guildId];

    player.setVolume(value);
    await interaction.editReply({ content: strings.volumeSet + value });
}

export {
    data,
    execute,
};