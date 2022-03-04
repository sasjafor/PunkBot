// adapted from https://github.com/MaxGfeller/youtube-search
import axios from 'axios';
import http2 from 'http2';
import querystring from 'querystring';

import { HTTPError } from './errors.js';

var allowedProperties = [
    'fields',
    'channelId',
    'channelType',
    'eventType',
    'forContentOwner',
    'forDeveloper',
    'forMine',
    'location',
    'locationRadius',
    'onBehalfOfContentOwner',
    'order',
    'pageToken',
    'publishedAfter',
    'publishedBefore',
    'regionCode',
    'relatedToVideoId',
    'relevanceLanguage',
    'safeSearch',
    'topicId',
    'type',
    'videoCaption',
    'videoCategoryId',
    'videoDefinition',
    'videoDimension',
    'videoDuration',
    'videoEmbeddable',
    'videoLicense',
    'videoSyndicated',
    'videoType',
    'key',
];

function search(term, opts, cb) {
    if (typeof opts === 'function') {
        cb = opts;
        opts = {};
    }

    if (!opts) {
        opts = {};
    }

    if (!cb) {
        return new Promise(function(resolve, reject) {
            search(term, opts, function(err, results, pageInfo) {
                if (err) {
                    return reject(err);
                }
                resolve({
                    results: results,
                    pageInfo: pageInfo,
                });
            });
        });
    }

    var params = {
        q: term,
        part: opts.part || 'snippet',
        maxResults: opts.maxResults || 30,
    };

    Object.keys(opts)
        .map(function(k) {
            if (allowedProperties.indexOf(k) > -1) {
                params[k] = opts[k];
            }
        });
    axios.get('https://youtube.googleapis.com/youtube/v3/search?' + querystring.stringify(params))
        .then(function(response) {
            var result = response.data;

            var pageInfo = {
                totalResults: result.pageInfo.totalResults,
                resultsPerPage: result.pageInfo.resultsPerPage,
                nextPageToken: result.nextPageToken,
                prevPageToken: result.prevPageToken,
            };

            var findings = result.items.map(function(item) {
                var link = '';
                var id = '';
                switch (item.id.kind) {
                    case 'youtube#channel':
                        link = 'https://www.youtube.com/channel/' + item.id.channelId;
                        id = item.id.channelId;
                        break;
                    case 'youtube#playlist':
                        link = 'https://www.youtube.com/playlist?list=' + item.id.playlistId;
                        id = item.id.playlistId;
                        break;
                    default:
                        link = 'https://www.youtube.com/watch?v=' + item.id.videoId;
                        id = item.id.videoId;
                        break;
                }

                return {
                    id: id,
                    link: link,
                    kind: item.id.kind,
                    publishedAt: item.snippet.publishedAt,
                    channelId: item.snippet.channelId,
                    channelTitle: item.snippet.channelTitle,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    thumbnails: item.snippet.thumbnails,
                };
            });

            return cb(null, findings, pageInfo);
        })
        .catch(function(err) {
            return cb(err);
        });
}

async function fastSearch(term, key) {
    return new Promise(function(resolve, reject) {
        var params = {
            q: term,
            key: key,
            part: 'snippet',
            type: 'video',
            maxResults: 1,
        };

        var data = '';

        const clientSession = http2.connect('https://youtube.googleapis.com');

        const req = clientSession.request({
            ':path': '/youtube/v3/search?' + querystring.stringify(params),
        });

        req.on('response', () => {
            req.on('data', (d) => {
                data += d;
            });
            req.on('end', () => {
                let json = JSON.parse(data);
                if (json.error && json.error.code !== 200) {
                    let error = new HTTPError(json.error.message);
                    error.response = json.error;
                    return reject(error);
                }
                var response = json.items[0];
                var result = {};
                if (response) {
                    result.url = 'https://www.youtube.com/watch?v=' + response.id.videoId;
                    result.id = response.id.videoId;
                    result.title = response.snippet.title;
                    clientSession.destroy();
                } else {
                    return resolve(false);
                }
                return resolve(result);
            });
        })
            .on('error', (e) => {
                reject(e);
            });
    });
}

function videoInfo(id, opts, cb) {
    if (typeof opts === 'function') {
        cb = opts;
        opts = {};
    }

    if (!opts) {
        opts = {};
    }

    if (!cb) {
        return new Promise(function(resolve, reject) {
            videoInfo(id, opts, function(err, results, pageInfo) {
                if (err) {
                    return reject(err);
                }
                resolve({
                    results: results,
                    pageInfo: pageInfo,
                });
            });
        });
    }

    var params = {
        id: id,
        part: opts.part || 'snippet',
    };

    Object.keys(opts)
        .map(function(k) {
            if (allowedProperties.indexOf(k) > -1) {
                params[k] = opts[k];
            }
        });

    axios.get('https://youtube.googleapis.com/youtube/v3/videos?' + querystring.stringify(params))
        .then(function(response) {
            var result = response.data;

            var pageInfo = {
                totalResults: result.pageInfo.totalResults,
                resultsPerPage: result.pageInfo.resultsPerPage,
            };

            var findings = result.items.map(function(item) {
                return {
                    kind: item.id.kind,
                    publishedAt: item.snippet.publishedAt,
                    channelId: item.snippet.channelId,
                    channelTitle: item.snippet.channelTitle,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    duration: item.contentDetails.duration,
                    thumbnails: item.snippet.thumbnails,
                };
            });

            return cb(null, findings, pageInfo);
        })
        .catch(function(err) {
            return cb(err);
        });
}

function playlistInfo(id, opts, pageToken, cb) {
    if (!opts) {
        opts = {};
    }

    if (!cb) {
        return new Promise(function(resolve, reject) {
            playlistInfo(id, opts, pageToken, function(/** @type {any} */ err, /** @type {any} */ results, /** @type {any} */ pageInfo) {
                if (err) {
                    return reject(err);
                }
                resolve({
                    results: results,
                    pageInfo: pageInfo,
                });
            });
        });
    }

    var params = {
        id: id,
        part: opts.part,
    };

    if (pageToken) {
        params.pageToken = pageToken;
    }

    Object.keys(opts)
        .map(function(k) {
            if (allowedProperties.indexOf(k) > -1) {
                params[k] = opts[k];
            }
        });

    axios.get('https://youtube.googleapis.com/youtube/v3/playlists?' + querystring.stringify(params))
        .then(function(response) {
            var result = response.data;

            var pageInfo = {
                totalResults: result.pageInfo.totalResults,
                resultsPerPage: result.pageInfo.resultsPerPage,
                nextPageToken: result.nextPageToken,
            };

            var findings = result.items.map(function(item) {
                return {
                    kind: item.kind,
                    publishedAt: item.snippet?.publishedAt,
                    channelId: item.snippet?.channelId,
                    channelTitle: item.snippet?.channelTitle,
                    title: item.snippet?.title,
                    description: item.snippet?.description,
                    thumbnails: item.snippet?.thumbnails,
                    itemCount: item.contentDetails?.itemCount,
                };
            });

            return cb(null, findings, pageInfo);
        })
        .catch(function(err) {
            return cb(err);
        });
}

function playlistItems(id, opts, pageToken, cb) {
    if (!opts) {
        opts = {};
    }

    if (!cb) {
        return new Promise(function(resolve, reject) {
            playlistItems(id, opts, pageToken, function(/** @type {any} */ err, /** @type {any} */ results, /** @type {any} */ pageInfo) {
                if (err) {
                    return reject(err);
                }
                resolve({
                    results: results,
                    pageInfo: pageInfo,
                });
            });
        });
    }

    var params = {
        playlistId: id,
        part: opts.part,
    };

    if (pageToken) {
        params.pageToken = pageToken;
    }

    Object.keys(opts)
        .map(function(k) {
            if (allowedProperties.indexOf(k) > -1) {
                params[k] = opts[k];
            }
        });

    axios.get('https://youtube.googleapis.com/youtube/v3/playlistItems?' + querystring.stringify(params))
        .then(function(response) {
            var result = response.data;

            var pageInfo = {
                totalResults: result.pageInfo.totalResults,
                resultsPerPage: result.pageInfo.resultsPerPage,
                nextPageToken: result.nextPageToken,
            };

            var findings = result.items.map(function(item) {
                return {
                    kind: item.kind,
                    videoId: item.contentDetails?.videoId,
                    title: item.snippet?.title,
                };
            });

            return cb(null, findings, pageInfo);
        })
        .catch(function(err) {
            return cb(err);
        });
}

export {
    search,
    fastSearch,
    videoInfo,
    playlistInfo,
    playlistItems,
};
