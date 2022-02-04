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

        let disconnectRes = player.disconnect();
        if (disconnectRes) {
            interaction.reply({ content: strings.disconnected });
        } else {
            interaction.reply({ content: strings.notConnected, ephemeral: true });
        }
    },
};