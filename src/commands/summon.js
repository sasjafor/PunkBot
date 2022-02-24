import { SlashCommandBuilder } from '@discordjs/builders';

import { strings } from '../lib/strings.js';

const data = new SlashCommandBuilder()
    .setName('summon')
    .setDescription('Summons the bot to your voice channel.');

async function execute(interaction, players) {
    if (!interaction.member.voice.channel.joinable) {
        interaction.reply({ content: strings.no_permission_to_connect + '`' + interaction.member.voice.channel.name + '`' , ephemeral: true });
        return;
    }

    let guildId = interaction.guild.id;
    let player = players[guildId];
    await player.connect(interaction.member.voice.channel);
    interaction.reply({ content: strings.joined + '`' + interaction.member.voice.channel.name + '`' });
}

export {
    data,
    execute,
};