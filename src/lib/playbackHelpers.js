import { AudioPlayerStatus } from '@discordjs/voice';
import decode from 'unescape';
import { EmbedBuilder } from 'discord.js';
import { logger } from './log.js';
import { errorReply, prettifyTime } from './util.js';


async function playItem(interaction, player, pb, youtubeCache, hasYoutubeCookies, searchQuery, playlist) {
    let playResult = null;
    let queued = false;
    if (player?.dispatcher?.state?.status !== AudioPlayerStatus.Playing) {
        player.enqueue(pb);
        logger.debug('Added ' + pb.url);
        playResult = player.play();
    } else {
        queued = true;
        if (pb.isAgeRestricted && !hasYoutubeCookies) {
            playResult = 2;
        } else {
            player.enqueue(pb);
        }
    }

    if (pb.isYT && !playlist) {
        youtubeCache.push(searchQuery, pb);
    }

    playResult = await playResult;
    switch (playResult) {
        case 1:
            errorReply(interaction, decode(pb.title), 'Failed to create stream for your request, try again!', pb.url);
            return;
        case 2:
            errorReply(interaction, decode(pb.title), 'Can\'t play age restricted video', pb.url);
            return;
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

    if (queued) {
        let timeUntilPlaying = await player.getTotalRemainingPlaybackTime();
        timeUntilPlaying.subtract(pb.duration);
        let prettyTut = prettifyTime(timeUntilPlaying);
        if (player.loop) {
            prettyTut = '∞';
        }
        embed.setAuthor({ name: 'Added to queue', iconURL: iconURL, url: 'https://github.com/sasjafor/PunkBot' })
            .addFields([{ name: 'Estimated time until playing', value: prettyTut },
                        { name: 'Position in queue', value: String(player.queue.getLength()) }]);
    }

    return embed;
}

export {
    createPlayEmbed,
    playItem,
};