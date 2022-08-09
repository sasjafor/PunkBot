import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { AudioPlayerStatus } from '@discordjs/voice';
import { SlashCommandBuilder } from '@discordjs/builders';

import { buttons } from '../lib/componentIDs.js';
import { prettifyTime } from '../lib/util.js';
import { strings } from '../lib/messageStrings.js';

const BUTTON_TIMEOUT = 300000;

const data = new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the queued songs.')
    .addIntegerOption(option =>
        option.setName('index')
            .setDescription('Index of page in the queue.')
            .setMinValue(1))
    .setDMPermission(false);

async function execute(interaction, players) {
    let index = interaction.options.getInteger('index');
    if (!index) {
        index = 1;
    }

    let guildId = interaction.guild.id;
    let player = players[guildId];

    if (!player.conn) {
        interaction.editReply({ content: strings.notConnected, ephemeral: true });
        return;
    }

    if (player?.dispatcher?.state?.status !== AudioPlayerStatus.Playing) {
        interaction.editReply({ content: strings.nothingPlaying, ephemeral: true });
        return;
    }

    let embed = await createList(interaction, player, index);
    if (!embed) {
        return;
    }

    let queueLength = player.getQueueLength();
    let numTabs = Math.ceil(queueLength / 10);
    let components = undefined;
    if (numTabs > 1) {
        components = createComponents(index, numTabs);
    }
    let message = await interaction.editReply({embeds: [embed], components: components });

    const collector = message.createMessageComponentCollector({ time: BUTTON_TIMEOUT });

    collector.on('collect', async i => {
        switch (i.customId) {
            case buttons.queuePrev:
                index--;
                break;
            case buttons.queueNext:
                index++;
                break;
        }
        let embed = await createList(interaction, player, index);
        let components = createComponents(index, numTabs);
        await i.update({ embeds: [embed], components: components });
    });

    collector.on('end', _collected => message.delete());
}

async function createList(interaction, player, index) {
    let np = player.getNowPlaying();
    if (!np) {
        return false;
    }

    let embed = new EmbedBuilder()
        .setTitle('Queue for ' + interaction.guild.name + '\n\u200b')
        .setURL('https://github.com/sasjafor/PunkBot')
        .setColor('#0000e5');
    let desc = '__Now Playing:__\n[' + np.title + '](' + np.url + ') | ' + prettifyTime(np.duration) + ' Requested by: <@' + np.requesterId + '>';

    let queueLength = player.getQueueLength();
    let numTabs = Math.ceil(queueLength / 10);
    if (queueLength > 0) {
        let queue = player.getQueue();
        let k = 0;
        if (index > 1) {
            if (index > numTabs) {
                interaction.editReply({ content: strings.invalidQueueTab + '**1-' + numTabs + '**', ephemeral: true });
                return false;
            } else {
                k = (index - 1) * 10 + 1;
                desc = '';
            }
        } else {
            desc += '\n\n:arrow_down:__Up Next:__:arrow_down:\n\n';
        }
        let stop = Math.min(k + 10, queueLength);
        for (let i = queue.get(k); k < stop; k++, i = queue.get(k)) {
            i = await i;
            desc += (k+1) + '. [' + i.title + '](' + i.url + ') | ' + prettifyTime(i.duration) + ' Requested by: <@' + i.requesterId + '>\n\n';
        }
        desc += '\n**' + queueLength + ' songs in queue | ' + prettifyTime(await player.getTotalQueueTime()) + ' total length**';
        if (numTabs > 1) {
            embed.setFooter({ text: 'Tab ' + index + '/' + numTabs, iconURL: interaction.member?.displayAvatarURL() });
        }
    }

    embed.setDescription(desc);

    return embed;
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
        .addComponents(
            prevButton,
            nextButton,
        );
    return [actionRow];
}

export {
    data,
    execute,
};