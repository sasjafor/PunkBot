import { SlashCommandBuilder } from '@discordjs/builders';

import { strings } from '../lib/strings.js';

const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops playback.');

async function execute(interaction, players) {
    let guildId = interaction.guild.id;
    let player = players[guildId];

    if (!player.conn) {
        interaction.reply({ content: strings.notConnected, ephemeral: true });
        return;
    }

    let stop = player.stop();
    switch (stop) {
        case 0:
            interaction.reply({ content: strings.stopped });
            break;
        case 1:
            interaction.reply({ content: strings.nothingPlaying, ephemeral: true });
            break;
    }
}

export {
    data,
    execute,
};