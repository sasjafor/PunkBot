const { DiscordAPIError, 
        MessageEmbed } = require('discord.js');
const { strings } = require('./strings');

async function errorReply(interaction, msgContent, msgTitle = strings.commandFailed, url = null) {
    let failEmbed = new MessageEmbed()
        .setColor('#FF0000')
        .setTitle(msgContent)
        .setAuthor({ name: msgTitle, iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'});

    if (url) {
        failEmbed = failEmbed.setURL(url);
    }

    if (interaction.replied) {
        await interaction.editReply({ embeds: [failEmbed], ephemeral: true });
    } else {
        try {
            await interaction.reply({ embeds: [failEmbed], ephemeral: true });
        } catch (err) {
            if (err instanceof DiscordAPIError && err.message.includes('Interaction has already been acknowledged.')) {
                await interaction.editReply({ embeds: [failEmbed], ephemeral: true });
            } else {
                console.error(err);
            }
        }
    }
    
}

function prettifyTime(duration) {
    if (duration) {
        let hours = duration.hours() + duration.days() * 24;
        let minutes = duration.minutes();
        let seconds = duration.seconds();
        var prettyHours = ((hours / 10 < 1) ? '0' : '') + hours + ':';
        var prettyMinutes = ((minutes / 10 < 1) ? '0' : '') + minutes + ':';
        var prettySeconds = ((seconds / 10 < 1) ? '0' : '') + seconds;
        var prettyTime = ((hours > 0) ? prettyHours : '') + prettyMinutes + prettySeconds;
        return prettyTime;
    } else {
        throw new Error('Invalid duration provided');
    }
}

module.exports = {
    errorReply,
    prettifyTime,
};