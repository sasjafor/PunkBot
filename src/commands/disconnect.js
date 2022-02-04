const { SlashCommandBuilder } = require('@discordjs/builders');

const { players } = require('../bot.js');
const { strings } = require('../lib/strings.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('disconnect')
		.setDescription('Disconnects the bot from the channel.')
    ,
	async execute(interaction) {
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
    },
};