import { SlashCommandBuilder } from '@discordjs/builders';
import { errorCode } from '../lib/errors.js';
import { logger } from '../lib/log.js';
import { strings } from '../lib/messageStrings.js';
const data = new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resumes playback.')
    .setDMPermission(false);
async function execute(interaction, players, _youtubeAPIKey, _youtubeCache, _hasYoutubeCookies = false) {
    const guildId = interaction.guild?.id;
    if (guildId === undefined) {
        interaction.editReply({ content: strings.unknownGuild });
        logger.error(strings.unknownGuild);
        return;
    }
    const player = players[guildId];
    if (!player.isConnected()) {
        interaction.editReply({ content: strings.notConnected });
        return;
    }
    const resume = player.resume();
    switch (resume) {
        case errorCode.OK:
            {
                interaction.editReply({ content: strings.resumed });
                break;
            }
        case errorCode.NOT_PLAYING:
            {
                interaction.editReply({ content: strings.nothingPlaying });
                break;
            }
        case errorCode.ALREADY_PLAYING:
            {
                interaction.editReply({ content: strings.alreadyPlaying });
                break;
            }
        default:
            {
                logger.error(`Unknown error with code ${resume}`);
                interaction.editReply({ content: strings.commandFailed });
            }
    }
}
export { data, execute, };
//# sourceMappingURL=resume.js.map