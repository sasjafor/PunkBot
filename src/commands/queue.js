import { AudioPlayerStatus } from '@discordjs/voice';
import { MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

import { prettifyTime } from '../lib/util.js';
import { strings } from '../lib/strings.js';


const data = new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the queued songs.')
    .addIntegerOption(option =>
        option.setName('index')
            .setDescription('Index of page in the queue.')
            .setMinValue(1));

async function execute(interaction, players) {
    let index = interaction.options.getInteger('index');
    if (!index) {
        index = 1;
    }

    let guildId = interaction.guild.id;
    let player = players[guildId];

    if (!player.conn) {
        interaction.reply({ content: strings.notConnected, ephemeral: true });
        return;
    }

    if (player?.dispatcher?.state?.status !== AudioPlayerStatus.Playing) {
        interaction.reply({ content: strings.nothingPlaying, ephemeral: true });
        return;
    }
    let np = player.getNowPlaying();
    if (!np) {
        return;
    }

    let embed = new MessageEmbed()
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
                interaction.reply({ content: strings.invalidQueueTab + '**1-' + numTabs + '**', ephemeral: true });
                return;
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
    interaction.reply({embeds: [embed]});
}

export {
    data,
    execute,
};