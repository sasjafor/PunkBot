import { SlashCommandBuilder } from '@discordjs/builders';

import { strings } from '../lib/strings.js';

const data = new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the playback volume.')
    .addNumberOption(option =>
        option.setName('value')
            .setDescription('Volume to set.')
            .setRequired(true)
            .setMinValue(0));

async function execute(interaction, players) {
    let value = interaction.options.getNumber('value');

    let guildId = interaction.guild.id;
    let player = players[guildId];

    player.setVolume(value);
    interaction.editReply({ content: strings.volumeSet + value });
}

export {
    data,
    execute,
};