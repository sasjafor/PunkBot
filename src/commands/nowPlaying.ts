import { ChatInputCommandInteraction, InteractionContextType } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { buildProgressBar, prettifyTime } from '../lib/util.js';
import { LimitedDict } from '../lib/limitedDict.js';
import { logger } from '../lib/log.js';
import { PlaybackItem } from '../lib/playbackItem.js';
import { PlayerDict } from '../types.js';
import { strings } from '../lib/messageStrings.js';

const data = new SlashCommandBuilder()
    .setName('now-playing')
    .setDescription('Shows the song that is currently playing.')
    .setContexts(InteractionContextType.Guild);

async function execute(interaction: ChatInputCommandInteraction, players: PlayerDict, _youtubeAPIKey: string, _youtubeCache: LimitedDict<PlaybackItem>, _hasYoutubeCookies = false): Promise<void> {
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

    const np = player.getNowPlaying();
    const progress = player.getProgress();
    if (np && progress) {
        const progressBar = buildProgressBar(progress, np.duration);
        const progressString = prettifyTime(progress) + ' / ' + prettifyTime(np.duration);
        const embed = new EmbedBuilder()
            .setTitle(np.title)
            .setAuthor({ name: 'Now Playing ♪', iconURL: np.requesterIconURL, url: 'https://github.com/sasjafor/PunkBot' })
            .setURL(np.url)
            .setThumbnail(np.thumbnailURL)
            .setColor('#0056bf')
            .setDescription('\u200B\n`' + progressBar + '`\n\n`' + progressString + '`\n\n`Requested by:` <@' + np.requesterId + '>');
        interaction.editReply({ embeds: [embed] });
    } else {
        interaction.editReply({ content: strings.nothingPlaying });
    }
}

export {
    data,
    execute,
};