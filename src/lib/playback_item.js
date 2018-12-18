
function PlaybackItem(url, duration) {
    this.url = url;
    this.duration = duration;

    this.setDuration = function(duration) {
        this.duration = duration;
    }
}

module.exports.PlaybackItem = PlaybackItem;
