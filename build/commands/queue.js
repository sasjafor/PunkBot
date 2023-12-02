import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, GuildMember } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { buttons } from '../lib/componentIDs.js';
import { logger } from '../lib/log.js';
import { prettifyTime } from '../lib/util.js';
import { strings } from '../lib/messageStrings.js';
const BUTTON_TIMEOUT = 300000;
const data = new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the queued songs.')
    .addIntegerOption(option => option.setName('index')
    .setDescription('Index of page in the queue.')
    .setMinValue(1))
    .setDMPermission(false);
async function execute(interaction, players, _youtubeAPIKey, _youtubeCache, _hasYoutubeCookies = false) {
    let index = interaction.options.getInteger('index') ?? 1;
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
    if (!player.isPlaying()) {
        interaction.editReply({ content: strings.nothingPlaying });
        return;
    }
    const embed = await createList(interaction, player, index);
    if (embed === null) {
        return;
    }
    const queueLength = player.getQueueLength();
    const numTabs = Math.ceil(queueLength / 10);
    let components;
    if (numTabs > 1) {
        components = createComponents(index, numTabs);
    }
    const message = await interaction.editReply({ embeds: embed, components: components });
    const collector = message.createMessageComponentCollector({ time: BUTTON_TIMEOUT });
    collector.on('collect', async (i) => {
        switch (i.customId) {
            case buttons.queuePrev:
                index--;
                break;
            case buttons.queueNext:
                index++;
                break;
            default:
                logger.error(`Unknown button with id ${i.customId}`);
                break;
        }
        const embed = await createList(interaction, player, index);
        const components = createComponents(index, numTabs);
        await i.update({ embeds: embed, components: components });
    });
    collector.on('end', async (_) => {
        await message.delete();
    });
}
async function createList(interaction, player, index) {
    const np = player.getNowPlaying();
    if (!np) {
        return;
    }
    const embed = new EmbedBuilder()
        .setTitle('Queue for ' + interaction.guild?.name + '\n\u200b')
        .setURL('https://github.com/sasjafor/PunkBot')
        .setColor('#0000e5');
    let desc = '__Now Playing:__\n[' + np.title + '](' + np.url + ') | ' + prettifyTime(np.duration) + ' Requested by: <@' + np.requesterId + '>';
    const queueLength = player.getQueueLength();
    const numTabs = Math.ceil(queueLength / 10);
    if (queueLength > 0) {
        let k = 0;
        if (index > 1) {
            if (index > numTabs) {
                interaction.editReply({ content: strings.invalidQueueTab + '**1-' + numTabs + '**' });
                return;
            }
            else {
                k = (index - 1) * 10 + 1;
                desc = '';
            }
        }
        else {
            desc += '\n\n:arrow_down:__Up Next:__:arrow_down:\n\n';
        }
        const stop = Math.min(k + 10, queueLength);
        for (let i = player.getQueueElem(k); k < stop; k++, i = player.getQueueElem(k)) {
            i = await i;
            desc += (k + 1) + '. [' + i.title + '](' + i.url + ') | ' + prettifyTime(i.duration) + ' Requested by: <@' + i.requesterId + '>\n\n';
        }
        desc += '\n**' + queueLength + ' songs in queue | ' + prettifyTime(await player.getTotalQueueTime()) + ' total length**';
        if (numTabs > 1) {
            const member = interaction.member;
            let avatarURL;
            if (member instanceof GuildMember) {
                avatarURL = member.displayAvatarURL();
            }
            embed.setFooter({ text: 'Tab ' + index + '/' + numTabs, iconURL: avatarURL });
        }
    }
    embed.setDescription(desc);
    return [embed];
}
function createComponents(index, numTabs) {
    const prevButton = new ButtonBuilder()
        .setCustomId(buttons.queuePrev)
        .setLabel('Prev')
        .setStyle(ButtonStyle.Secondary);
    if (index === 1) {
        prevButton.setDisabled(true);
    }
    const nextButton = new ButtonBuilder()
        .setCustomId(buttons.queueNext)
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary);
    if (index === numTabs) {
        nextButton.setDisabled(true);
    }
    const actionRow = new ActionRowBuilder()
        .addComponents(prevButton, nextButton);
    return [actionRow];
}
export { data, execute, };
//# sourceMappingURL=queue.js.map