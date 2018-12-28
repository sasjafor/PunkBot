
function PlaybackItem(url, requester, title, thumbnailURL, duration) {
    this.url = url;
    this.duration = duration;
    this.requester = requester;
    this.title = title;
    this.thumbnailURL = thumbnailURL;

    this.setTitle = function(title) {
        this.title = title;
    }

    this.setDuration = function(duration) {
        this.duration = duration;
    }

    this.setThumbnailURL = function(thumbnailURL) {
        this.thumbnailURL = thumbnailURL;
    }
}

module.exports.PlaybackItem = PlaybackItem;
