const { SlashCommandBuilder } = require('@discordjs/builders');

const { players } = require('../bot.js');
const { strings } = require('../lib/strings.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skips the current song.')
    ,
	async execute(interaction) {
        let guildId = interaction.guild.id;
        let player = players[guildId];

        let skip = player.skip();
        if (skip) {
            interaction.reply({ content: strings.skipped + '`' + skip + '`'});
        } else {
            interaction.reply({ content: strings.nothingPlaying, ephemeral: true });
        }
    },
};