import { SlashCommandBuilder } from '@discordjs/builders';

import { strings } from '../lib/messageStrings.js';

const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops playback.')
    .setDMPermission(false);

async function execute(interaction, players) {
    let guildId = interaction.guild.id;
    let player = players[guildId];

    if (!player.conn) {
        interaction.editReply({ content: strings.notConnected, ephemeral: true });
        return;
    }

    let stop = player.stop();
    switch (stop) {
        case 0:
            interaction.editReply({ content: strings.stopped });
            break;
        case 1:
            interaction.editReply({ content: strings.nothingPlaying, ephemeral: true });
            break;
    }
}

export {
    data,
    execute,
};