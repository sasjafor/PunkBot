const { SlashCommandBuilder } = require('@discordjs/builders');
const moment = require('moment');

const { players } = require('../bot.js');
const { prettifyTime } = require('../lib/util.js');
const { strings } = require('../lib/strings.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('seek')
		.setDescription('Seek to the provided position in the track.')
        .addStringOption(option => 
            option.setName('time')
                .setDescription('Time to seek to.')
                .setRequired(true))
    ,
	async execute(interaction) {
        let time = interaction.options.getString('time');

        let guildId = interaction.guild.id;
        let player = players[guildId];

        if (!player.conn) {
            interaction.reply({ content: strings.notConnected, ephemeral: true });
            return;
        }

        let seek_time_regex = /(([0-9]+:)?([0-9]+:)?)?[0-9]+$/;
        if (!seek_time_regex.test(time) || (time.match(seek_time_regex)).index != 0) {
            interaction.reply({ content: strings.invalidSeekFormat, ephemeral: true });
            return;
        }
        let min_hour_regex = /([0-9]+)(?::)/g;
        let time1 = min_hour_regex.exec(time);
        let time2 = min_hour_regex.exec(time);
        let seconds = parseInt(time.match(/[0-9]+$/)[0], 10);
        let minutes = 0;
        let hours = 0;
        if (time1) {
            if (time2) {
                minutes = parseInt(time2[1], 10);
                hours = parseInt(time1[1], 10);
            } else {
                minutes = parseInt(time1[1], 10);
            }
        }
        let seek_time = 3600 * hours + 60 * minutes + seconds;
        let duration = moment.duration(seek_time * 1000);
        let res_code = await player.seek(seek_time);
        switch (res_code) {
            case 0:
                var pretty_time = prettifyTime(duration);
                interaction.reply({ content: strings.seeked + '`' + pretty_time + '`' });
                break;
            case 1:
                interaction.reply({ content: strings.seekTooLong, ephemeral: true });
                break;
            case 2:
                interaction.reply({ content: strings.nothingPlaying, ephemeral: true });
                break;
        }
    },
};