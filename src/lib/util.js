import { execa } from 'execa';
import moment from 'moment';

import { DiscordAPIError,
         EmbedBuilder } from 'discord.js';
import { playlistItems, videoInfo } from './youtubeAPI.js';
import { logger } from './log.js';
import { PlaybackItem } from './playbackItem.js';
import { strings } from './strings.js';

async function errorReply(interaction, msgContent, errorMessage = strings.commandFailed, url = null, channel = null, avatarURL = 'https://media.wired.com/photos/5a15e608801bd64d76805764/4:3/w_408,h_306,c_limit/rickastley.jpg') {
    if (!msgContent) {
        msgContent = strings.errorMsgNotAvailable;
    }
    let embed = new EmbedBuilder()
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
                    logger.error(error);
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
    let idRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
    let match = url.match(idRegex);

    if (match && match.length > 1) {
        return match[1];
    } else {
        return null;
    }
}

async function handleVideo(id, requester, url, title, youtubeAPIKey, duration) {
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
            let isAgeRestricted = res.contentRating?.ytRating === 'ytAgeRestricted';
            return new PlaybackItem(ytUrl, requester.displayName, requester.user.id, requester.displayAvatarURL(), ytTitle, ytThumbnailURL, ytDuration, ytChannelTitle, isAgeRestricted);
        } else {
            throw new Error('Failed to get video info');
        }
    } else {
        return new PlaybackItem(url, requester.displayName, requester.user.id, requester.displayAvatarURL(), title, null, duration, null);
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
            logger.error(error);
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
                    logger.error(error);
                    return null;
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
    logger.debug('DONE processing playlist!');
    if (callback) {
        callback(successCount, failCount);
    }
}

async function getAudioDurationInSeconds(url) {
    let params = [
        '-v',
        'error',
        '-select_streams',
        'a:0',
        '-show_format',
        '-show_streams',
    ];

    let { stdout } = await execa('ffprobe', [...params, url]);

    let matches = stdout.match(/duration="?(\d*\.\d*)"?/);

    if (matches && matches[1]) {
        return parseFloat(matches[1]);
    } else {
        '0';
    }
}

export {
    buildProgressBar,
    errorReply,
    getAudioDurationInSeconds,
    getYTid,
    handlePlaylist,
    handleVideo,
    prettifyTime,
};