import { GuildMember } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { logger } from '../lib/log.js';
import { strings } from '../lib/messageStrings.js';
const data = new SlashCommandBuilder()
    .setName('summon')
    .setDescription('Summons the bot to your voice channel.')
    .setDMPermission(false);
async function execute(interaction, players, _youtubeAPIKey, _youtubeCache, _hasYoutubeCookies = false) {
    if (!(interaction.member instanceof GuildMember)) {
        await interaction.editReply({ content: strings.notGuildMember });
        logger.debug(strings.notGuildMember);
        return;
    }
    if (!interaction?.member?.voice?.channel?.joinable) {
        await interaction.editReply({ content: strings.noPermissionToConnect + '`' + interaction?.member?.voice?.channel?.name + '`' });
        return;
    }
    const guildId = interaction.guild?.id;
    if (guildId === undefined) {
        await interaction.editReply({ content: strings.unknownGuild });
        logger.error(strings.unknownGuild);
        return;
    }
    const player = players[guildId];
    player.connect(interaction.member?.voice?.channel);
    await interaction.editReply({ content: strings.joined + '`' + interaction.member?.voice?.channel?.name + '`' });
}
export { data, execute, };
//# sourceMappingURL=summon.js.map