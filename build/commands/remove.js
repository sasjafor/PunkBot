import { SlashCommandBuilder } from '@discordjs/builders';
import { logger } from '../lib/log.js';
import { strings } from '../lib/messageStrings.js';
const data = new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove the indicated track.')
    .addIntegerOption(option => option.setName('index')
    .setDescription('Index to remove from queue.')
    .setRequired(true)
    .setMinValue(1))
    .setDMPermission(false);
async function execute(interaction, players, _youtubeAPIKey, _youtubeCache, _hasYoutubeCookies = false) {
    const index = interaction.options.getInteger('index');
    if (index === null) {
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
    const removedItem = player.remove(index);
    if (removedItem !== null) {
        interaction.editReply({ content: strings.removed + removedItem.title });
    }
    else {
        interaction.editReply({ content: strings.outOfRange });
    }
}
export { data, execute, };
//# sourceMappingURL=remove.js.map