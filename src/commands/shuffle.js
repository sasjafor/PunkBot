import { SlashCommandBuilder } from '@discordjs/builders';

import { players } from '../bot.js';
import { strings } from '../lib/strings.js';

const data = new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffles the queue.');

async function execute(interaction) {
    let guildId = interaction.guild.id;
        let player = players[guildId];

        if (!player.conn) {
            interaction.reply({ content: strings.notConnected, ephemeral: true });
            return;
        }

        player.shuffle();
        interaction.reply({ content: strings.shuffled });
}

export {
	data,
	execute,
};