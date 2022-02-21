import { SlashCommandBuilder } from '@discordjs/builders';

import { players } from '../bot.js';
import { strings } from '../lib/strings.js';

const data = new SlashCommandBuilder()
    .setName('disconnect')
    .setDescription('Disconnects the bot from the channel.')

async function execute(interaction) {
    let guildId = interaction.guild.id;
        let player = players[guildId];

        if (!player.conn) {
            interaction.reply({ content: strings.notConnected, ephemeral: true });
            return;
        }

        let disconnectRes = player.disconnect();
        if (disconnectRes) {
            interaction.reply({ content: strings.disconnected });
        } else {
            // TODO: this shouldn't happen, right?
            interaction.reply({ content: strings.notConnected, ephemeral: true });
        }
}

export {
	data,
	execute,
};