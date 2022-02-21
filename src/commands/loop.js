import { SlashCommandBuilder } from '@discordjs/builders';

import { players } from '../bot.js';
import { strings } from '../lib/strings.js';

const data = new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggle looping of current track.');

async function execute(interaction) {
    let guildId = interaction.guild.id;
    let player = players[guildId];

    player.loop = !player.loop;
    if (player.loop) {
        interaction.reply({ content: strings.loopEnabled });
    } else {
        interaction.reply({ content: strings.loopDisabled });
    }
}

export {
    data,
    execute,
};