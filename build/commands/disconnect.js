import { SlashCommandBuilder } from '@discordjs/builders';
import { errorCode } from '../lib/errors.js';
import { logger } from '../lib/log.js';
import { strings } from '../lib/messageStrings.js';
const data = new SlashCommandBuilder()
    .setName('disconnect')
    .setDescription('Disconnects the bot from the channel.')
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
        interaction.editReply({ content: strings.notConnected });
        return;
    }
    const disconnectRes = player.disconnect();
    switch (disconnectRes) {
        case errorCode.OK:
            {
                interaction.editReply({ content: strings.disconnected });
                break;
            }
        case errorCode.ERROR:
            {
                interaction.editReply({ content: strings.notConnected });
                break;
            }
        default:
            {
                logger.error(`Unknown error with code ${disconnectRes}`);
                interaction.editReply({ content: strings.commandFailed });
            }
    }
}
export { data, execute, };
//# sourceMappingURL=disconnect.js.map