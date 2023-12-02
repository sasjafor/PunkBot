import moment from 'moment';
class PlaybackItem {
    url;
    duration;
    requesterName;
    requesterId;
    requesterIconURL;
    title;
    thumbnailURL;
    channelTitle;
    stream;
    isYT;
    isAgeRestricted;
    seekTime;
    constructor(url, requesterName, requesterId, requesterIconURL, title, thumbnailURL = null, duration = moment.duration('0'), channelTitle = null, isAgeRestricted = false, seekTime = 0) {
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
export { PlaybackItem, };
//# sourceMappingURL=playbackItem.js.map