import { SlashCommandBuilder } from '@discordjs/builders';

import { strings } from '../lib/strings.js';

const data = new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pauses playback.');

async function execute(interaction, players) {
    let guildId = interaction.guild.id;
    let player = players[guildId];

    if (!player.conn) {
        interaction.reply({ content: strings.notConnected, ephemeral: true });
        return;
    }

    let pause = player.pause();
    switch (pause) {
        case 0:
            interaction.reply({ content: strings.paused });
            break;
        case 1:
            interaction.reply({ content: strings.nothingPlaying, ephemeral: true });
            break;
        case 2:
            interaction.reply({ content: strings.alreadyPaused, ephemeral: true });
            break;
    }
}

export {
    data,
    execute,
};