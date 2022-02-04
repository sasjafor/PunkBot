const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const { players } = require('../bot.js');
const { prettifyTime } = require('../lib/util.js');
const { strings } = require('../lib/strings.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Show the queued songs.')
        .addIntegerOption(option => 
            option.setName('index')
                .setDescription('Index of page in the queue.')
                .setMinValue(1))
    ,
	async execute(interaction) {
        let index = interaction.options.getInteger('index');
        if (!index) {
            index = 1;
        }

        let guildId = interaction.guild.id;
        let player = players[guildId];

        if (!player.playing) {
            interaction.reply({ content: strings.nothing_playing });
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
        let desc = '\n\n__Now Playing:__\n[' + np.title + '](' + np.url + ') | `' + prettifyTime(np.duration) + ' Requested by:` <@' + np.requesterId + '>';

        let queue_length = player.getQueueLength();
        let num_tabs = Math.ceil(queue_length / 10);
        if (queue_length > 0) {
            let queue = player.getQueue();
            let k = 0;
            if (index > 1) {
                if (index > num_tabs) {
                    interaction.reply({ content: strings.invalid_queue_tab + '**1-' + num_tabs + '**', ephemeral: true });
                    return;
                } else {
                    k = (index - 1) * 10 + 1;
                    desc = '';
                }
            } else {
                desc += '\n\n\n:arrow_down:__Up Next:__:arrow_down:\n\n';
            }
            let stop = Math.min(k + 10, queue_length);
            for (let i = queue.get(k); k < stop; k++, i = queue.get(k)) {
                i = await i;
                desc += (k+1) + '. [' + i.title + '](' + i.url + ') | `' + prettifyTime(i.duration) + ' Requested by:` <@' + i.requesterId + '>\n\n';
            }
            desc += '\n**' + queue_length + ' songs in queue | ' + prettifyTime(await player.getTotalQueueTime()) + ' total length**';
            if (num_tabs > 1) {
                embed.setFooter('Tab ' + index + '/' + num_tabs, interaction.member.avatarURL());
            }
        }

        embed.setDescription(desc);
        interaction.reply({embeds: [embed]});
    },
};