import { SlashCommandBuilder } from '@discordjs/builders';
import { logger } from '../lib/log.js';
import { strings } from '../lib/messageStrings.js';
const data = new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the playback volume.')
    .addNumberOption(option => option.setName('value')
    .setDescription('Volume to set.')
    .setRequired(true)
    .setMinValue(0))
    .setDMPermission(false);
async function execute(interaction, players, _youtubeAPIKey, _youtubeCache, _hasYoutubeCookies = false) {
    const value = interaction.options.getNumber('value');
    if (value === null) {
        return;
    }
    const guildId = interaction.guild?.id;
    if (guildId === undefined) {
        await interaction.editReply({ content: strings.unknownGuild });
        logger.error(strings.unknownGuild);
        return;
    }
    const player = players[guildId];
    player.setVolume(value);
    await interaction.editReply({ content: strings.volumeSet + value });
}
export { data, execute, };
//# sourceMappingURL=volume.js.map