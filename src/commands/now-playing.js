const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const { players } = require('../bot.js');
const { prettifyTime } = require('../lib/util.js');
const { strings } = require('../lib/strings.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('now-playing')
		.setDescription('Shows the song that is currently playing.')
    ,
	async execute(interaction) {
        let guildId = interaction.guild.id;
        let player = players[guildId];

        let np = player.getNowPlaying();
        let progress = player.getProgress();
        if (np && progress) {
            let progressBar = buildProgressBar(progress, np.duration);
            let progressString = prettifyTime(progress) + ' / ' + prettifyTime(np.duration);
            let embed = new MessageEmbed()
                .setTitle(np.title)
                .setAuthor({ name: 'Now Playing ♪', iconURL: np.requesterIconURL, url: 'https://github.com/sasjafor/PunkBot' })
                .setURL(np.url)
                .setThumbnail(np.thumbnailURL)
                .setColor('#0056bf')
                .setDescription('\u200B\n`' + progressBar + '`\n\n`' + progressString + '`\n\n`Requested by:` <@' + np.requesterId + '>');
            interaction.reply({ embeds: [embed] });
        } else {
            interaction.reply({ content: strings.nothingPlaying, ephemeral: true });
        }
    },
};

function buildProgressBar(progress, total_time) {
    let pr = progress.asSeconds();
    let tt = total_time.asSeconds();

    if (pr > tt) {
        tt = pr;
    }

    let mul = 30 / tt;
    let pos = Math.round(pr * mul);
    let res = '';
    for (let i = 0; i < pos; i++) {
        res += '▬';
    }
    res += '🔘';
    let rest = 30 - pos;
    for (let i = 0; i < rest; i++) {
        res += '▬';
    }
    return res;
}