import { CommandInteraction, EmbedBuilder, MessageComponentInteraction } from 'discord.js';

import { errorReply, prettifyTime } from './util.js';
import { LimitedDict } from './limitedDict.js';
import { logger } from './log.js';
import { PlaybackItem } from './playbackItem.js';
import { Player } from './player.js';

async function playItem(interaction: CommandInteraction | MessageComponentInteraction, player: Player, pb: PlaybackItem, youtubeCache: LimitedDict<PlaybackItem>, hasYoutubeCookies: boolean, searchQuery: string, isPlaylist: boolean, doPlayNext: boolean = false): Promise<number> {
    let playResult = 0;
    let queueIndex = 0;

    if (pb.isAgeRestricted && !hasYoutubeCookies) {
        playResult = 2;
    } else {
        if (player.isIdle()) {
            await player.enqueue(pb, doPlayNext);
            logger.debug('Added ' + pb.url);
            player.play();
        } else {
            queueIndex = await player.enqueue(pb, doPlayNext);
        }
    }

    if (pb.isYT && !isPlaylist) {
        youtubeCache.push(searchQuery, pb);
    }

    switch (playResult) {
        case 0:
        {
            return queueIndex;
        }
        case 1:
        {
            errorReply(interaction, decodeURI(pb.title), 'Failed to create stream for your request, try again!', pb.url);
            return -1;
        }
        case 2:
        {
            errorReply(interaction, decodeURI(pb.title), 'Can\'t play age restricted video', pb.url);
            return -1;
        }
        default:
        {
            logger.error(`Unknown error with code ${playResult}`);
            return -1;
        }
    }
}

async function createPlayEmbed(pb: PlaybackItem, iconURL: string, queueIndex: number, player: Player): Promise<EmbedBuilder> {
    const prettyDuration = prettifyTime(pb.duration);
    let embed = new EmbedBuilder()
        .setTitle(decodeURI(pb.title))
        .setAuthor({ name: 'Playing', iconURL: iconURL, url: 'https://github.com/sasjafor/PunkBot' })
        .setURL(pb.url);

    if (pb.isYT) {
        const channelTitle = pb.channelTitle ? pb.channelTitle : '';
        embed = embed.setThumbnail(pb.thumbnailURL)
            .addFields([{ name: 'Channel', value: channelTitle }]);
    }

    embed.addFields([{ name: 'Song Duration', value: prettyDuration }]);

    if (queueIndex > 0) {
        const timeUntilPlaying = await player.getTimeUntil(queueIndex - 1);
        let prettyTut = prettifyTime(timeUntilPlaying);
        if (player.isLooping()) {
            prettyTut = '∞';
        }
        embed.setAuthor({ name: 'Added to queue', iconURL: iconURL, url: 'https://github.com/sasjafor/PunkBot' })
            .addFields([{ name: 'Estimated time until playing', value: prettyTut },
                        { name: 'Position in queue', value: String(queueIndex) }]);
    }

    return embed;
}

export {
    createPlayEmbed,
    playItem,
};