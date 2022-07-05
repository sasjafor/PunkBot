import { SlashCommandBuilder } from '@discordjs/builders';

import { strings } from '../lib/strings.js';

const data = new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resumes playback.');

async function execute(interaction, players) {
    let guildId = interaction.guild.id;
    let player = players[guildId];

    if (!player.conn) {
        interaction.reply({ content: strings.notConnected, ephemeral: true });
        return;
    }

    let resume = player.resume();
    switch (resume) {
        case 0:
            interaction.reply({ content: strings.resumed });
            break;
        case 1:
            interaction.reply({ content: strings.nothingPlaying, ephemeral: true });
            break;
        case 2:
            interaction.reply({ content: strings.alreadyPlaying, ephemeral: true });
            break;
    }
}

export {
    data,
    execute,
};