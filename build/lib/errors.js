const errorCode = {
    OK: 0,
    ERROR: 1,
    NOT_PLAYING: 2,
    ALREADY_PAUSED: 3,
    ALREADY_PLAYING: 4,
    SEEK_ERROR: 5,
    CONFIRM_AGE: 6,
};
class HTTPError extends Error {
    response;
    constructor(message, response = null) {
        super(message);
        this.response = response;
    }
}
export { errorCode, HTTPError, };
//# sourceMappingURL=errors.js.map