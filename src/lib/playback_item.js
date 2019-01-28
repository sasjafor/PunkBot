function PlaybackItem(url, requester, title, thumbnailURL, duration, channelTitle) {
    this.url = url;
    this.duration = duration;
    this.requester = requester;
    this.title = title;
    this.thumbnailURL = thumbnailURL;
    this.channelTitle = channelTitle;

    this.setTitle = function(title) {
        this.title = title;
    };

    this.setDuration = function(duration) {
        this.duration = duration;
    };

    this.setThumbnailURL = function(thumbnailURL) {
        this.thumbnailURL = thumbnailURL;
    };

    this.setChannelTitle = function(title) {
        this.channelTitle = title;
    };
}

module.exports.PlaybackItem = PlaybackItem;
