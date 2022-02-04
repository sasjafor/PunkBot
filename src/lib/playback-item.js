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

        this.setTitle = function (title) {
            this.title = title;
        };

        this.setDuration = function (duration) {
            this.duration = duration;
        };

        this.setThumbnailURL = function (thumbnailURL) {
            this.thumbnailURL = thumbnailURL;
        };

        this.setChannelTitle = function (title) {
            this.channelTitle = title;
        };
    }
}

module.exports = {
    PlaybackItem,
};
