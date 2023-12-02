import { AudioResource } from '@discordjs/voice';
import moment from 'moment';
import { Snowflake } from 'discord-api-types/v6';

class PlaybackItem {
    url: string;
    duration: moment.Duration;
    requesterName: string;
    requesterId: string;
    requesterIconURL: string;
    title: string;
    thumbnailURL: string | null;
    channelTitle: string | null;
    stream: AudioResource | null;
    isYT: boolean;
    isAgeRestricted: boolean;
    seekTime: number;

    constructor(url: string, requesterName: string, requesterId: Snowflake, requesterIconURL: string, title: string, thumbnailURL: string | null = null, duration: moment.Duration = moment.duration('0'), channelTitle: string | null = null, isAgeRestricted = false, seekTime = 0) {
        this.url = url;
        this.duration = duration;
        this.requesterName = requesterName;
        this.requesterId = requesterId;
        this.requesterIconURL = requesterIconURL;
        this.title = title;
        this.thumbnailURL = thumbnailURL;
        this.channelTitle = channelTitle;
        this.stream = null;
        this.isYT = false;
        this.isAgeRestricted = isAgeRestricted;
        this.seekTime = seekTime; // seek time in seconds
    }
}

export {
    PlaybackItem,
};
