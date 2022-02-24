import { SlashCommandBuilder } from '@discordjs/builders';

import { strings } from '../lib/strings.js';

const data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips the current song.');

async function execute(interaction, players) {
    let guildId = interaction.guild.id;
    let player = players[guildId];

    if (!player.conn) {
        interaction.reply({ content: strings.notConnected, ephemeral: true });
        return;
    }

    let skip = player.skip();
    if (skip) {
        interaction.reply({ content: strings.skipped + '`' + skip + '`'});
    } else {
        interaction.reply({ content: strings.nothingPlaying, ephemeral: true });
    }
}

export {
    data,
    execute,
};