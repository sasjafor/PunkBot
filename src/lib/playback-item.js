class PlaybackItem {
    constructor(url, requesterName, requesterId, requesterIconURL, title, thumbnailURL, duration, channelTitle) {
        this.url = url;
        this.duration = duration;
        this.requesterName = requesterName;
        this.requesterId = requesterId;
        this.requesterIconURL = requesterIconURL;
        this.title = title;
        this.thumbnailURL = thumbnailURL;
        this.channelTitle = channelTitle;
        this.stream = null;
    }

    setTitle(title) {
        this.title = title;
    }

    setDuration(duration) {
        this.duration = duration;
    }

    setThumbnailURL(thumbnailURL) {
        this.thumbnailURL = thumbnailURL;
    }

    setChannelTitle(title) {
        this.channelTitle = title;
    }
}

module.exports = {
    PlaybackItem,
};
