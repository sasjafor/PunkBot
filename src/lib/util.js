function prettifyTime(duration) {
    if (duration) {
        let hours = duration.hours() + duration.days() * 24;
        let minutes = duration.minutes();
        let seconds = duration.seconds();
        var pretty_hours = ((hours / 10 < 1) ? '0' : '') + hours + ':';
        var pretty_minutes = ((minutes / 10 < 1) ? '0' : '') + minutes + ':';
        var pretty_seconds = ((seconds / 10 < 1) ? '0' : '') + seconds;
        var pretty_time = ((hours > 0) ? pretty_hours : '') + pretty_minutes + pretty_seconds;
        return pretty_time;
    } else {
        throw new Error('Invalid duration provided');
    }
}

module.exports = {
    prettifyTime,
}