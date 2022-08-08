import { EmbedBuilder } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { buildProgressBar, prettifyTime } from '../lib/util.js';
import { strings } from '../lib/messageStrings.js';

const data = new SlashCommandBuilder()
    .setName('now-playing')
    .setDescription('Shows the song that is currently playing.')
    .setDMPermission(false);

async function execute(interaction, players) {
    let guildId = interaction.guild.id;
    let player = players[guildId];

    if (!player.conn) {
        interaction.editReply({ content: strings.notConnected, ephemeral: true });
        return;
    }

    let np = player.getNowPlaying();
    let progress = player.getProgress();
    if (np && progress) {
        let progressBar = buildProgressBar(progress, np.duration);
        let progressString = prettifyTime(progress) + ' / ' + prettifyTime(np.duration);
        let embed = new EmbedBuilder()
            .setTitle(np.title)
            .setAuthor({ name: 'Now Playing ♪', iconURL: np.requesterIconURL, url: 'https://github.com/sasjafor/PunkBot' })
            .setURL(np.url)
            .setThumbnail(np.thumbnailURL)
            .setColor('#0056bf')
            .setDescription('\u200B\n`' + progressBar + '`\n\n`' + progressString + '`\n\n`Requested by:` <@' + np.requesterId + '>');
        interaction.editReply({ embeds: [embed] });
    } else {
        interaction.editReply({ content: strings.nothingPlaying, ephemeral: true });
    }
}

export {
    data,
    execute,
};