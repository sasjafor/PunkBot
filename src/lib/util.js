import { DiscordAPIError, 
         MessageEmbed } from 'discord.js';
import { strings } from './strings.js';

async function errorReply(interaction, msgContent, errorMessage = strings.commandFailed, url = null, channel = null, avatarURL = null) {
    if (!msgContent) {
        msgContent = strings.errorMsgNotAvailable;
    }
    let embed = new MessageEmbed()
        .setColor('#FF0000')
        .setTitle(msgContent);

    if (url) {
        embed = embed.setURL(url);
    }

    if (interaction) {
        embed = embed.setAuthor({ name: errorMessage, iconURL: interaction.member.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'});

        let message = { embeds: [embed], ephemeral: true };
        if (interaction.replied) {
            await interaction.editReply(message);
        } else {
            try {
                await interaction.reply(message);
            } catch(error) {
                if (error instanceof DiscordAPIError && error.message.includes('Interaction has already been acknowledged.')) {
                    await interaction.editReply(message);
                } else {
                    console.trace(error.name + ': ' + error.message);
                }
            }
        }
    } else {
        embed = embed.setAuthor({ name: errorMessage, iconURL: avatarURL, url: 'https://github.com/sasjafor/PunkBot'});

        let message = { embeds: [embed] };
        channel.send(message);
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

class HTTPError extends Error {
    constructor(message) {
        super(message);
        this.response = null;
    }
}

export {
    errorReply,
    HTTPError,
    prettifyTime,
};