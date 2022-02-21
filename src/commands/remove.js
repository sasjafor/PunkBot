import { SlashCommandBuilder } from '@discordjs/builders';

import { players } from '../bot.js';
import { strings } from '../lib/strings.js';

const data = new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove the indicated track.')
    .addIntegerOption(option => 
        option.setName('index')
            .setDescription('Index to remove from queue.')
            .setRequired(true)
            .setMinValue(1));

async function execute(interaction) {
    let index = interaction.options.getInteger('index');

    let guildId = interaction.guild.id;
    let player = players[guildId];

    if (!player.conn) {
        interaction.reply({ content: strings.notConnected, ephemeral: true });
        return;
    }

    let removeRes = player.remove(index);
    if (removeRes == -1) {
        // TODO: might be unnecessary now
        interaction.reply({ content: strings.notConnected, ephemeral: true });
    } else if(removeRes) {
        interaction.reply({ content: strings.removed + removeRes.title });
    } else {
        interaction.reply({ content: strings.outOfRange, ephemeral: true });
    }
}

export {
	data,
	execute,
};