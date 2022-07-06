import { SlashCommandBuilder } from '@discordjs/builders';

import { strings } from '../lib/strings.js';

const data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips the current song.');

async function execute(interaction, players) {
    let guildId = interaction.guild.id;
    let player = players[guildId];

    if (!player.conn) {
        interaction.reply({ content: strings.notConnected, ephemeral: true });
        return;
    }

    let skip = player.skip();
    let nowPlaying = player.getNowPlaying();
    if (skip) {
        let resString = strings.skipped + '`' + skip + '`';
        if (nowPlaying) {
            resString += '\n:arrow_forward: **Playing**  ' + '`' + nowPlaying.title + '`';
        }
        interaction.reply({ content: resString });
    } else {
        interaction.reply({ content: strings.nothingPlaying, ephemeral: true });
    }
}

export {
    data,
    execute,
};