import { SlashCommandBuilder } from '@discordjs/builders';

import { strings } from '../lib/messageStrings.js';

const data = new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resumes playback.')
    .setDMPermission(false);

async function execute(interaction, players) {
    let guildId = interaction.guild.id;
    let player = players[guildId];

    if (!player.conn) {
        interaction.editReply({ content: strings.notConnected, ephemeral: true });
        return;
    }

    let resume = player.resume();
    switch (resume) {
        case 0:
            interaction.editReply({ content: strings.resumed });
            break;
        case 1:
            interaction.editReply({ content: strings.nothingPlaying, ephemeral: true });
            break;
        case 2:
            interaction.editReply({ content: strings.alreadyPlaying, ephemeral: true });
            break;
    }
}

export {
    data,
    execute,
};