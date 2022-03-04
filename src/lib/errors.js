class HTTPError extends Error {
    constructor(message, response = null) {
        super(message);
        this.response = response;
    }
}

export {
    HTTPError,
};