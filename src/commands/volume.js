const { SlashCommandBuilder } = require('@discordjs/builders');

const { players } = require('../bot.js');
const { strings } = require('../lib/strings.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('volume')
		.setDescription('Set the playback volume.')
        .addNumberOption(option => 
            option.setName('value')
                .setDescription('Volume to set.')
                .setRequired(true)
                .setMinValue(0))
    ,
	async execute(interaction) {
        let value = interaction.options.getNumber('value');

        let guildId = interaction.guild.id;
        let player = players[guildId];

        player.setVolume(value);
        interaction.reply({ content: strings.volumeSet + value });
    },
};