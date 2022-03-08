import Debug from 'debug';
import moment from 'moment';

import { DiscordAPIError,
         MessageEmbed } from 'discord.js';
import { playlistItems, videoInfo } from './youtubeAPI.js';
import { PlaybackItem } from './playbackItem.js';
import { strings } from './strings.js';

// eslint-disable-next-line no-unused-vars
const debug = Debug('punk_bot');
// eslint-disable-next-line no-unused-vars
const debugv = Debug('punk_bot:verbose');
const debugd = Debug('punk_bot:debug');

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
        embed = embed.setAuthor({ name: errorMessage, iconURL: interaction.member?.displayAvatarURL(), url: 'https://github.com/sasjafor/PunkBot'});

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

function buildProgressBar(progress, totalTime) {
    let pr = progress.asSeconds();
    let tt = totalTime.asSeconds();

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

/**
 * @param {string} url
 */
function getYTid(url) {
    let idRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    let match = url.match(idRegex);

    if (match && match.length > 1) {
        return match[1];
    } else {
        return null;
    }
}

async function handleVideo(id, requester, url, title, youtubeAPIKey) {
    if (id) {
        let res;
        let videoOpts = {
            key: youtubeAPIKey,
            part: 'contentDetails,snippet',
        };

        res = await videoInfo(id, videoOpts, null);
        res = res?.results[0];

        if (res) {
            let ytUrl = 'https://www.youtube.com/watch?v=' + id;
            let ytTitle = res.title;
            let ytThumbnailURL = res.thumbnails.maxres?.url;
            if (!ytThumbnailURL) {
                ytThumbnailURL = res.thumbnails.standard?.url;
            }
            let ytDuration = moment.duration(res.duration);
            let ytChannelTitle = res.channelTitle;
            return new PlaybackItem(ytUrl, requester.displayName, requester.user.id, requester.displayAvatarURL(), ytTitle, ytThumbnailURL, ytDuration, ytChannelTitle);
        } else {
            throw new Error('Failed to get video info');
        }
    } else {
        return new PlaybackItem(url, requester.displayName, requester.user.id, requester.displayAvatarURL(), title);
    }
}

async function handlePlaylist(player, id, requester, skipFirst, callback, channel, avatarURL, youtubeAPIKey) {
    let skipped = false;
    let pageInfo = null;
    let pageToken = null;
    let successCount = 0;
    if (skipFirst) {
        successCount++;
    }
    let failCount = 0;
    do {
        let res;
        try {
            let playlistOpts = {
                key: youtubeAPIKey,
                part: 'contentDetails,snippet',
                maxResults: 50,
            };
            res = await playlistItems(id, playlistOpts, pageToken, null);
        } catch(error) {
            console.trace(error.name + ': ' + error.message);
            let url = 'https://www.youtube.com/playlist?list=' + id;
            errorReply(undefined, url, error.response?.data?.error?.message, url, channel, avatarURL);
            return null;
        }
        pageInfo = res.pageInfo;
        pageToken = (pageInfo) ? pageInfo.nextPageToken : null;
        let items = res.results;

        for (let i of items) {
            if (skipped || !skipFirst) {
                let YTurl = 'https://www.youtube.com/watch?v=' + i.videoId;
                let video = await handleVideo(i.videoId, requester, YTurl, null, youtubeAPIKey).catch((error) => {
                    console.trace(error.name + ': ' + error.message);
                });
                if (video) {
                    successCount++;
                    player.enqueue(video);
                } else {
                    failCount++;
                }
            }
            skipped = true;
        }
    } while (pageInfo?.nextPageToken);
    debugd('DONE processing playlist!');
    if (callback) {
        callback(successCount, failCount);
    }
}

export {
    buildProgressBar,
    errorReply,
    getYTid,
    handlePlaylist,
    handleVideo,
    prettifyTime,
};