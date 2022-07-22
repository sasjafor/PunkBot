import { SlashCommandBuilder } from '@discordjs/builders';

import { strings } from '../lib/strings.js';

const data = new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffles the queue.')
    .setDMPermission(false);

async function execute(interaction, players) {
    let guildId = interaction.guild.id;
    let player = players[guildId];

    if (!player.conn) {
        interaction.editReply({ content: strings.notConnected, ephemeral: true });
        return;
    }

    player.shuffle();
    interaction.editReply({ content: strings.shuffled });
}

export {
    data,
    execute,
};