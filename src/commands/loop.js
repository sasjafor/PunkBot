const { SlashCommandBuilder } = require('@discordjs/builders');

const { players } = require('../bot.js');
const { strings } = require('../lib/strings.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('loop')
		.setDescription('Toggle looping of current track.')
    ,
	async execute(interaction) {
        let guildId = interaction.guild.id;
        let player = players[guildId];

        player.loop = !player.loop;
        if (player.loop) {
            interaction.reply({ content: strings.loop_enabled });
        } else {
            interaction.reply({ content: strings.loop_disabled });
        }
    },
};