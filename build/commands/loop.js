import { SlashCommandBuilder } from '@discordjs/builders';
import { logger } from '../lib/log.js';
import { strings } from '../lib/messageStrings.js';
const data = new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggle looping of current track.')
    .setDMPermission(false);
async function execute(interaction, players, _youtubeAPIKey, _youtubeCache, _hasYoutubeCookies = false) {
    const guildId = interaction.guild?.id;
    if (guildId === undefined) {
        await interaction.editReply({ content: strings.unknownGuild });
        logger.error(strings.unknownGuild);
        return;
    }
    const player = players[guildId];
    const isLoop = player.switchLoop();
    if (isLoop) {
        interaction.editReply({ content: strings.loopEnabled });
    }
    else {
        interaction.editReply({ content: strings.loopDisabled });
    }
}
export { data, execute, };
//# sourceMappingURL=loop.js.map