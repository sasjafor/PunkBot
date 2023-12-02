import { SlashCommandBuilder } from '@discordjs/builders';
import { errorCode } from '../lib/errors.js';
import { logger } from '../lib/log.js';
import { strings } from '../lib/messageStrings.js';
const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops playback.')
    .setDMPermission(false);
async function execute(interaction, players, _youtubeAPIKey, _youtubeCache, _hasYoutubeCookies = false) {
    const guildId = interaction.guild?.id;
    if (guildId === undefined) {
        await interaction.editReply({ content: strings.unknownGuild });
        logger.error(strings.unknownGuild);
        return;
    }
    const player = players[guildId];
    if (!player.isConnected()) {
        await interaction.editReply({ content: strings.notConnected });
        return;
    }
    const stop = player.stop();
    switch (stop) {
        case errorCode.OK:
            {
                await interaction.editReply({ content: strings.stopped });
                break;
            }
        case errorCode.NOT_PLAYING:
            {
                await interaction.editReply({ content: strings.nothingPlaying });
                break;
            }
        default:
            {
                logger.error(`Unknown error with code ${stop}`);
                interaction.editReply({ content: strings.commandFailed });
            }
    }
}
export { data, execute, };
//# sourceMappingURL=stop.js.map