import { SlashCommandBuilder } from '@discordjs/builders';

import { strings } from '../lib/strings.js';

const data = new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggle looping of current track.');

async function execute(interaction, players) {
    let guildId = interaction.guild.id;
    let player = players[guildId];

    player.loop = !player.loop;
    if (player.loop) {
        interaction.editReply({ content: strings.loopEnabled });
    } else {
        interaction.editReply({ content: strings.loopDisabled });
    }
}

export {
    data,
    execute,
};