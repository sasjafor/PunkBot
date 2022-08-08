import { SlashCommandBuilder } from '@discordjs/builders';

import { strings } from '../lib/messageStrings.js';

const data = new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pauses playback.')
    .setDMPermission(false);

async function execute(interaction, players) {
    let guildId = interaction.guild.id;
    let player = players[guildId];

    if (!player.conn) {
        interaction.editReply({ content: strings.notConnected, ephemeral: true });
        return;
    }

    let pause = player.pause();
    switch (pause) {
        case 0:
            interaction.editReply({ content: strings.paused });
            break;
        case 1:
            interaction.editReply({ content: strings.nothingPlaying, ephemeral: true });
            break;
        case 2:
            interaction.editReply({ content: strings.alreadyPaused, ephemeral: true });
            break;
    }
}

export {
    data,
    execute,
};