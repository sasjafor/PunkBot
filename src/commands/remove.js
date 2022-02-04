const { SlashCommandBuilder } = require('@discordjs/builders');

const { players } = require('../bot.js');
const { strings } = require('../lib/strings.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove the indicated track.')
        .addIntegerOption(option => 
            option.setName('index')
                .setDescription('Index to remove from queue.')
                .setRequired(true)
                .setMinValue(1))
    ,
	async execute(interaction) {
        let index = interaction.options.getInteger('index');

        let guildId = interaction.guild.id;
        let player = players[guildId];

        let removeRes = player.remove(index);
        if (removeRes == -1) {
            interaction.reply({ content: strings.notConnected, ephemeral: true });
        } else if(removeRes) {
            interaction.reply({ content: strings.removed + removeRes.title });
        } else {
            interaction.reply({ content: strings.outOfRange, ephemeral: true });
        }
    },
};