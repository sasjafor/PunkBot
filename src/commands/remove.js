import { SlashCommandBuilder } from '@discordjs/builders';

import { strings } from '../lib/messageStrings.js';

const data = new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove the indicated track.')
    .addIntegerOption(option =>
        option.setName('index')
            .setDescription('Index to remove from queue.')
            .setRequired(true)
            .setMinValue(1))
    .setDMPermission(false);

async function execute(interaction, players) {
    let index = interaction.options.getInteger('index');

    let guildId = interaction.guild.id;
    let player = players[guildId];

    if (!player.conn) {
        interaction.editReply({ content: strings.notConnected, ephemeral: true });
        return;
    }

    let removeRes = player.remove(index);
    if (removeRes) {
        interaction.editReply({ content: strings.removed + removeRes.title });
    } else {
        interaction.editReply({ content: strings.outOfRange, ephemeral: true });
    }
}

export {
    data,
    execute,
};