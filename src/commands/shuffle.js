const { SlashCommandBuilder } = require('@discordjs/builders');

const { players } = require('../bot.js');
const { strings } = require('../lib/strings.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shuffle')
		.setDescription('Shuffles the queue.')
    ,
	async execute(interaction) {
        let guildId = interaction.guild.id;
        let player = players[guildId];

        if (!player.conn) {
            interaction.reply({ content: strings.notConnected, ephemeral: true });
            return;
        }

        player.shuffle();
        interaction.reply({ content: strings.shuffled });
    },
};