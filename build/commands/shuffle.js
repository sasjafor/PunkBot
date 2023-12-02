import { SlashCommandBuilder } from '@discordjs/builders';
import { logger } from '../lib/log.js';
import { strings } from '../lib/messageStrings.js';
const data = new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffles the queue.')
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
    player.shuffle();
    await interaction.editReply({ content: strings.shuffled });
}
export { data, execute, };
//# sourceMappingURL=shuffle.js.map