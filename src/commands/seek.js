import moment from 'moment';
import { SlashCommandBuilder } from '@discordjs/builders';

import { prettifyTime } from '../lib/util.js';
import { strings } from '../lib/strings.js';

const data = new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Seek to the provided position in the track.')
    .addStringOption(option =>
        option.setName('time')
            .setDescription('Time to seek to.')
            .setRequired(true));

async function execute(interaction, players) {
    let time = interaction.options.getString('time');

    let guildId = interaction.guild.id;
    let player = players[guildId];

    if (!player.conn) {
        interaction.reply({ content: strings.notConnected, ephemeral: true });
        return;
    }

    let seekTimeRegex = /(([0-9]+:)?([0-9]+:)?)?[0-9]+$/;
    if (!seekTimeRegex.test(time) || (time.match(seekTimeRegex)).index !== 0) {
        interaction.reply({ content: strings.invalidSeekFormat, ephemeral: true });
        return;
    }
    let minHourRegex = /([0-9]+)(?::)/g;
    let time1 = minHourRegex.exec(time);
    let time2 = minHourRegex.exec(time);
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
    let seekTime = 3600 * hours + 60 * minutes + seconds;
    let duration = moment.duration(seekTime * 1000);
    let resCode = await player.seek(seekTime);
    switch (resCode) {
        case 0:
            var prettyTime = prettifyTime(duration);
            interaction.reply({ content: strings.seeked + '`' + prettyTime + '`' });
            break;
        case 3:
            interaction.reply({ content: strings.seekTooLong, ephemeral: true });
            break;
        case 2:
            interaction.reply({ content: strings.nothingPlaying, ephemeral: true });
            break;
    }
}

export {
    data,
    execute,
};