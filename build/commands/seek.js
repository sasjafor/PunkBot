import moment from 'moment';
import { SlashCommandBuilder } from '@discordjs/builders';
import { errorCode } from '../lib/errors.js';
import { logger } from '../lib/log.js';
import { prettifyTime } from '../lib/util.js';
import { strings } from '../lib/messageStrings.js';
const data = new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Seek to the provided position in the track.')
    .addStringOption(option => option.setName('time')
    .setDescription('Time to seek to.')
    .setRequired(true))
    .setDMPermission(false);
async function execute(interaction, players, _youtubeAPIKey, _youtubeCache, _hasYoutubeCookies = false) {
    const time = interaction.options.getString('time');
    if (time === null) {
        interaction.editReply({ content: strings.invalidSeekFormat });
        return;
    }
    const guildId = interaction.guild?.id;
    if (guildId === undefined) {
        await interaction.editReply({ content: strings.unknownGuild });
        logger.error(strings.unknownGuild);
        return;
    }
    const player = players[guildId];
    if (!player.isConnected()) {
        interaction.editReply({ content: strings.notConnected });
        return;
    }
    const seekTimeRegex = /(([0-9]+:)?([0-9]+:)?)?[0-9]+$/;
    if (!seekTimeRegex.test(time) || (time.match(seekTimeRegex))?.index !== 0) {
        interaction.editReply({ content: strings.invalidSeekFormat });
        return;
    }
    const minHourRegex = /([0-9]+)(?::)/g;
    const time1 = minHourRegex.exec(time);
    const time2 = minHourRegex.exec(time);
    const time3 = time.match(/[0-9]+$/);
    if (time3 === null) {
        interaction.editReply({ content: strings.invalidSeekFormat });
        return;
    }
    const seconds = parseInt(time3[0], 10);
    let minutes = 0;
    let hours = 0;
    if (time1) {
        if (time2) {
            minutes = parseInt(time2[1], 10);
            hours = parseInt(time1[1], 10);
        }
        else {
            minutes = parseInt(time1[1], 10);
        }
    }
    const seekTime = 3600 * hours + 60 * minutes + seconds;
    const duration = moment.duration(seekTime * 1000);
    const resCode = await player.seek(seekTime);
    switch (resCode) {
        case errorCode.OK:
            {
                const prettyTime = prettifyTime(duration);
                interaction.editReply({ content: strings.seeked + '`' + prettyTime + '`' });
                break;
            }
        case errorCode.NOT_PLAYING:
            {
                interaction.editReply({ content: strings.nothingPlaying });
                break;
            }
        case errorCode.SEEK_ERROR:
            {
                interaction.editReply({ content: strings.seekTooLong });
                break;
            }
        default:
            {
                logger.error(`Unknown error with code ${resCode}`);
                interaction.editReply({ content: strings.commandFailed });
            }
    }
}
export { data, execute, };
//# sourceMappingURL=seek.js.map