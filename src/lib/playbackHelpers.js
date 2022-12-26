import { AudioPlayerStatus } from '@discordjs/voice';
import decode from 'unescape';
import { EmbedBuilder } from 'discord.js';

import { errorReply, prettifyTime } from './util.js';
import { logger } from './log.js';

async function playItem(interaction, player, pb, youtubeCache, hasYoutubeCookies, searchQuery, playlist, doPlayNext) {
    let playResult = null;
    let queued = 0;
    if (player?.dispatcher?.state?.status !== AudioPlayerStatus.Playing) {
        player.enqueue(pb, doPlayNext);
        logger.debug('Added ' + pb.url);
        playResult = player.play();
    } else {
        if (pb.isAgeRestricted && !hasYoutubeCookies) {
            playResult = 2;
        } else {
            queued = player.enqueue(pb, doPlayNext);
        }
    }

    if (pb.isYT && !playlist) {
        youtubeCache.push(searchQuery, pb);
    }

    playResult = await playResult;
    switch (playResult) {
        case 1:
            errorReply(interaction, decode(pb.title), 'Failed to create stream for your request, try again!', pb.url);
            return -1;
        case 2:
            errorReply(interaction, decode(pb.title), 'Can\'t play age restricted video', pb.url);
            return -1;
    }

    return queued;
}

async function createPlayEmbed(pb, iconURL, queued, player) {
    var prettyDuration = prettifyTime(pb.duration);
    let embed = new EmbedBuilder()
        .setTitle(decode(pb.title))
        .setAuthor({ name: 'Playing', iconURL: iconURL, url: 'https://github.com/sasjafor/PunkBot' })
        .setURL(pb.url);

    if (pb.isYT) {
        embed = embed.setThumbnail(pb.thumbnailURL)
            .addFields([{ name: 'Channel', value: pb.channelTitle }]);
    }

    embed.addFields([{ name: 'Song Duration', value: prettyDuration }]);

    if (queued > 0) {
        let timeUntilPlaying = await player.getTimeUntil(queued - 1);
        // timeUntilPlaying.subtract(pb.duration);
        let prettyTut = prettifyTime(timeUntilPlaying);
        if (player.loop) {
            prettyTut = '∞';
        }
        embed.setAuthor({ name: 'Added to queue', iconURL: iconURL, url: 'https://github.com/sasjafor/PunkBot' })
            .addFields([{ name: 'Estimated time until playing', value: prettyTut },
                        { name: 'Position in queue', value: String(queued) }]);
    }

    return embed;
}

export {
    createPlayEmbed,
    playItem,
};