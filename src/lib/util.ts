import { execa } from 'execa';
import moment from 'moment';

import {
    CommandInteraction,
    DiscordAPIError,
    EmbedBuilder,
    GuildMember,
    GuildTextBasedChannel,
    MessageComponentInteraction,
    Snowflake,
} from 'discord.js';
import { playlistItems, videoInfo } from './youtubeAPI.js';
import { logger } from './log.js';
import { PlaybackItem } from './playbackItem.js';
import { Player } from './player.js';
import { strings } from './messageStrings.js';
import { YoutubeAPIOptions } from '../types.js';

async function errorReply(interaction: CommandInteraction | MessageComponentInteraction | null, msgContent: string, errorMessage: string = strings.commandFailed, url: string | null = null, channel: GuildTextBasedChannel | null = null, avatarURL = 'https://media.wired.com/photos/5a15e608801bd64d76805764/4:3/w_408,h_306,c_limit/rickastley.jpg'): Promise<void> {
    if (!msgContent) {
        msgContent = strings.errorMsgNotAvailable;
    }
    let embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(msgContent);

    if (url) {
        embed = embed.setURL(url);
    }

    if (interaction !== null && interaction !== undefined) {
        let iconURL: string | undefined = undefined;
        if (interaction.member instanceof GuildMember) {
            iconURL = interaction.member?.displayAvatarURL();
        }
        embed = embed.setAuthor({ name: errorMessage, iconURL: iconURL, url: 'https://github.com/sasjafor/PunkBot' });

        const message = { embeds: [embed], ephemeral: true };
        try {
            await interaction.editReply(message);
        } catch (error) {
            if (error instanceof DiscordAPIError && error.message.includes('Interaction has already been acknowledged.')) {
                await interaction.editReply(message);
            } else {
                logger.error(error);
            }
        }
    } else if (channel !== null) {
        embed = embed.setAuthor({ name: errorMessage, iconURL: avatarURL, url: 'https://github.com/sasjafor/PunkBot' });

        const message = { embeds: [embed] };
        channel.send(message);
    }
}

function prettifyTime(duration: moment.Duration): string {
    if (duration) {
        const hours = duration.hours() + duration.days() * 24;
        const minutes = duration.minutes();
        const seconds = duration.seconds();
        const prettyHours = ((hours / 10 < 1) ? '0' : '') + hours + ':';
        const prettyMinutes = ((minutes / 10 < 1) ? '0' : '') + minutes + ':';
        const prettySeconds = ((seconds / 10 < 1) ? '0' : '') + seconds;
        const prettyTime = ((hours > 0) ? prettyHours : '') + prettyMinutes + prettySeconds;
        return prettyTime;
    } else {
        throw new Error('Invalid duration provided: ' + duration);
    }
}

function buildProgressBar(progress: moment.Duration, totalTime: moment.Duration): string {
    const pr = progress.asSeconds();
    let tt = totalTime.asSeconds();

    if (pr > tt) {
        tt = pr;
    }

    const mul = 30 / tt;
    const pos = Math.round(pr * mul);
    let res = '';
    for (let i = 0; i < pos; i++) {
        res += '▬';
    }
    res += '🔘';
    const rest = 30 - pos;
    for (let i = 0; i < rest; i++) {
        res += '▬';
    }
    return res;
}

/**
 * @param {string} url
 */
function getYTid(url: string): string | null {
    const idRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(idRegex);

    if (match && match.length > 1) {
        return match[1];
    } else {
        return null;
    }
}

function getSeekTime(url: string): number {
    const seekTimeRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?)|youtu\.be\/|youtube\.com\/shorts\/)(?:[a-zA-Z0-9_-]{11}[?&]t=)([0-9]+)/;
    const match = url.match(seekTimeRegex);

    if (match && match.length > 1) {
        return Number(match[1]);
    } else {
        return 0;
    }
}

async function handleYTVideo(id: Snowflake, requester: GuildMember, youtubeAPIKey: string, seekTime = 0): Promise<PlaybackItem> {
    const videoOpts = {
        id: id,
        key: youtubeAPIKey,
        part: 'contentDetails,snippet',
    };

    const res = (await videoInfo(videoOpts))?.results[0];

    if (res) {
        const ytUrl = 'https://www.youtube.com/watch?v=' + id;
        const ytTitle = res.title;
        let ytThumbnailURL = res.thumbnails.maxres?.url;
        if (!ytThumbnailURL) {
            ytThumbnailURL = res.thumbnails.standard?.url;
        }
        const ytDuration = moment.duration(res.duration);
        const ytChannelTitle = res.channelTitle;
        const isAgeRestricted = res.contentRating?.ytRating === 'ytAgeRestricted';

        const pb = new PlaybackItem(ytUrl, requester.displayName, requester.user.id, requester.displayAvatarURL(), ytTitle, ytThumbnailURL, ytDuration, ytChannelTitle, isAgeRestricted, seekTime);
        pb.isYT = true;
        return pb;
    } else {
        throw new Error('Failed to get video info');
    }
}

function handleAudioResource(requester: GuildMember, url: string, title: string, duration: moment.Duration = moment.duration(0), seekTime = 0): PlaybackItem {
    const pb = new PlaybackItem(url, requester.displayName, requester.user.id, requester.displayAvatarURL(), title, null, duration, null, false, seekTime);
    pb.isYT = false;
    return pb;
}

type handlePlaylistCallback = (_successCount: number, _failCount: number) => void;

async function handleYTPlaylist(player: Player, id: Snowflake, requester: GuildMember, skipFirst: boolean, callback: handlePlaylistCallback, channel: GuildTextBasedChannel, avatarURL: string, youtubeAPIKey: string): Promise<void> {
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
            const playlistOpts: YoutubeAPIOptions = {
                id: id,
                key: youtubeAPIKey,
                part: 'contentDetails,snippet',
                maxResults: 50,
            };

            if (pageToken !== null) {
                playlistOpts.pageToken = pageToken;
            }

            res = await playlistItems(playlistOpts);
        } catch (error) {
            logger.error(error);
            const url = 'https://www.youtube.com/playlist?list=' + id;
            errorReply(null, url, error.response?.data?.error?.message, url, channel, avatarURL);
            return;
        }
        pageInfo = res.pageInfo;
        pageToken = (pageInfo) ? pageInfo.nextPageToken : null;
        const items = res.results;

        for (const i of items) {
            if (skipped || !skipFirst) {
                const video = await handleYTVideo(i.videoId, requester, youtubeAPIKey).catch((error) => {
                    logger.error(error);
                });
                if (video) {
                    successCount++;
                    await player.enqueue(video);
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

async function getAudioDurationInSeconds(url: string): Promise<number> {
    const params = [
        '-v',
        'error',
        '-select_streams',
        'a:0',
        '-show_format',
        '-show_streams',
    ];

    const { stdout } = await execa('ffprobe', [...params, url]);

    const matches = stdout.match(/duration="?(\d*\.\d*)"?/);

    if (matches && matches[1]) {
        return parseFloat(matches[1]);
    } else {
        return 0;
    }
}

export {
    buildProgressBar,
    errorReply,
    getAudioDurationInSeconds,
    getSeekTime,
    getYTid,
    handleAudioResource,
    handleYTPlaylist,
    handleYTVideo,
    prettifyTime,
};