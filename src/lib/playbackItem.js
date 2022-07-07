import moment from 'moment';

class PlaybackItem {
    constructor(url, requesterName, requesterId, requesterIconURL, title, thumbnailURL = null, duration = moment.duration('0'), channelTitle = null, isAgeRestricted = false) {
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
    }
}

export {
    PlaybackItem,
};
