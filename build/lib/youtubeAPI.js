// adapted from https://github.com/MaxGfeller/youtube-search
import axios from 'axios';
import http2 from 'http2';
import querystring from 'querystring';
import { HTTPError } from './errors.js';
import { logger } from './log.js';
async function search(params) {
    const response = await axios.get('https://youtube.googleapis.com/youtube/v3/search?' + querystring.stringify(params));
    const result = response.data;
    const pageInfo = {
        totalResults: result.pageInfo.totalResults,
        resultsPerPage: result.pageInfo.resultsPerPage,
        nextPageToken: result.nextPageToken,
        prevPageToken: result.prevPageToken,
    };
    const findings = result.items.map(function (item) {
        let link = '';
        let id = '';
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
    return {
        results: findings,
        pageInfo: pageInfo,
    };
}
async function fastSearch(term, key) {
    return new Promise(function (resolve, reject) {
        const params = {
            q: term,
            key: key,
            part: 'snippet',
            type: 'video',
            maxResults: 1,
        };
        let data = '';
        const clientSession = http2.connect('https://youtube.googleapis.com');
        const req = clientSession.request({
            ':path': '/youtube/v3/search?' + querystring.stringify(params),
        });
        req.on('response', () => {
            req.on('data', (d) => {
                data += d;
            });
            req.on('end', () => {
                const json = JSON.parse(data);
                if (json.error && json.error.code !== 200) {
                    const error = new HTTPError(json.error.message, json.error);
                    return reject(error);
                }
                const response = json.items[0];
                if (response) {
                    const result = {
                        url: 'https://www.youtube.com/watch?v=' + response.id.videoId,
                        id: response.id.videoId,
                        title: response.snippet.title,
                    };
                    clientSession.destroy();
                    return resolve(result);
                }
                else {
                    return resolve(null);
                }
            });
        })
            .on('error', (e) => {
            reject(e);
        });
    });
}
async function videoInfo(params) {
    const response = await axios.get('https://youtube.googleapis.com/youtube/v3/videos?' + querystring.stringify(params));
    const result = response.data;
    const pageInfo = {
        totalResults: result.pageInfo.totalResults,
        resultsPerPage: result.pageInfo.resultsPerPage,
    };
    const findings = result.items.map(function (item) {
        return {
            kind: item.kind,
            publishedAt: item.snippet.publishedAt,
            channelId: item.snippet.channelId,
            channelTitle: item.snippet.channelTitle,
            title: item.snippet.title,
            description: item.snippet.description,
            duration: item.contentDetails.duration,
            contentRating: item.contentDetails.contentRating,
            thumbnails: item.snippet.thumbnails,
        };
    });
    if (findings.length === 0) {
        logger.error('No video info found!');
        throw new Error();
    }
    return {
        results: findings,
        pageInfo: pageInfo,
    };
}
async function playlistInfo(params) {
    const response = await axios.get('https://youtube.googleapis.com/youtube/v3/playlists?' + querystring.stringify(params));
    const result = response.data;
    const pageInfo = {
        totalResults: result.pageInfo.totalResults,
        resultsPerPage: result.pageInfo.resultsPerPage,
        nextPageToken: result.nextPageToken,
    };
    const findings = result.items.map(function (item) {
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
    return {
        results: findings,
        pageInfo: pageInfo,
    };
}
async function playlistItems(params) {
    const response = await axios.get('https://youtube.googleapis.com/youtube/v3/playlistItems?' + querystring.stringify(params));
    const result = response.data;
    const pageInfo = {
        totalResults: result.pageInfo.totalResults,
        resultsPerPage: result.pageInfo.resultsPerPage,
        nextPageToken: result.nextPageToken,
    };
    const findings = result.items.map(function (item) {
        return {
            kind: item.kind,
            videoId: item.contentDetails?.videoId,
            title: item.snippet?.title,
        };
    });
    return {
        results: findings,
        pageInfo: pageInfo,
    };
}
export { search, fastSearch, videoInfo, playlistInfo, playlistItems, };
//# sourceMappingURL=youtubeAPI.js.map