import * as youtubeAPI from 'lib/youtubeAPI';

const { PassThrough } = require('stream');

import mockAxios from 'axios';
jest.mock('axios');

import mockHttp2 from 'http2';
jest.mock('http2');

describe('lib', function () {
    describe('youtubeAPI', function () {
        const query = 'last christmas';
        const youtubeAPIKey = '12345';

        const mockSearchResponse = {
            data: {
                pageInfo: {
                    totalResults: '',
                    resultsPerPage: '',
                },
                nextPageToken: '',
                prevPageToken: '',
                items: [
                    {
                        id: {
                            kind: '',
                            videoId: '',
                        },
                        snippet: {
                            publishedAt: '',
                            channelId: '',
                            channelTitle: '',
                            title: '',
                            description: '',
                            thumbnails: '',
                        },
                        contentDetails: {
                            itemCount: '',
                            videoId: '',
                        },
                    },
                    {
                        id: {
                            kind: 'youtube#channel',
                            channelId: '',
                        },
                        snippet: {
                            publishedAt: '',
                            channelId: '',
                            channelTitle: '',
                            title: '',
                            description: '',
                            thumbnails: '',
                        },
                        contentDetails: {},
                    },
                    {
                        id: {
                            kind: 'youtube#playlist',
                            playlistId: '',
                        },
                        snippet: {
                            publishedAt: '',
                            channelId: '',
                            channelTitle: '',
                            title: '',
                            description: '',
                            thumbnails: '',
                        },
                        contentDetails: {},
                    },
                ],
            },
        };

        const opts = {
            key: youtubeAPIKey,
            part: 'contentDetails,snippet',
            maxResults: 50,
        };

        const axiosSuccess = jest.fn().mockResolvedValue(mockSearchResponse);
        const axiosError = jest.fn().mockRejectedValue(new Error());

        var mockStream = new PassThrough();
        const mockSession = {
            request: jest.fn(() => {
                return mockStream;
            }),
            destroy: jest.fn(),
        };
        mockHttp2.connect = jest.fn().mockReturnValue(mockSession);

        const jsonStringError =
        '{\
            "error":{\
                "code":400\
            }\
        }';

        const jsonStringSuccess =
        '{\
            "items":[\
                {\
                    "id":{\
                        "videoId":1245\
                    },\
                    "snippet":{\
                        "title":"Last Christmas"\
                    }\
                }\
            ]\
        }';

        const jsonStringEmpty =
        '{\
            "items":[]\
        }';

        beforeEach(() => {
            jest.clearAllMocks();

            mockAxios.get = axiosSuccess;
            mockStream = new PassThrough();
        });

        describe('search', function () {
            it('search no args, error', function() {
                mockAxios.get = axiosError;
                expect(youtubeAPI.search(query)).rejects.toThrow();
            });

            it('search', function() {
                youtubeAPI.search(query, opts, jest.fn());
            });

            it('search no opts', function() {
                youtubeAPI.search(query, jest.fn());
            });

            it('search no callback', function() {
                youtubeAPI.search(query);
            });
        });

        describe('videoInfo', function () {
            it('videoInfo no args, error', function() {
                mockAxios.get = axiosError;
                expect(youtubeAPI.videoInfo(query)).rejects.toThrow();
            });

            it('videoInfo', function() {
                youtubeAPI.videoInfo(query, opts, jest.fn());
            });

            it('videoInfo no opts', function() {
                youtubeAPI.videoInfo(query, jest.fn());
            });

            it('videoInfo no callback', function() {
                youtubeAPI.videoInfo(query);
            });
        });

        describe('playlistInfo', function () {
            it('playlistInfo no args, error', function() {
                mockAxios.get = axiosError;
                expect(youtubeAPI.playlistInfo(query)).rejects.toThrow();
            });

            it('playlistInfo', function() {
                youtubeAPI.playlistInfo(query, opts, jest.fn());
            });

            it('playlistInfo no opts', function() {
                youtubeAPI.playlistInfo(query, jest.fn());
            });
        });

        describe('playlistItems', function () {
            it('playlistItems no args, error', function() {
                mockAxios.get = axiosError;
                expect(youtubeAPI.playlistItems(query)).rejects.toThrow();
            });

            it('playlistItems', function() {
                youtubeAPI.playlistItems(query, opts, jest.fn());
            });

            it('playlistItems no opts', function() {
                youtubeAPI.playlistItems(query, jest.fn());
            });

            it('playlistItems no callback', function() {
                youtubeAPI.playlistItems(query);
            });
        });

        describe('fastSearch', function () {
            it('fastSearch', async function() {
                let res = youtubeAPI.fastSearch(query, youtubeAPIKey);
                mockStream.emit('response');
                mockStream.emit('data', jsonStringSuccess);
                mockStream.emit('end');
                await res;
            });

            it('fastSearch API error', async function() {
                let res = expect(youtubeAPI.fastSearch(query, youtubeAPIKey)).rejects.toThrow();
                mockStream.emit('response');
                mockStream.emit('data', jsonStringError);
                mockStream.emit('end');
                await res;
            });

            it('fastSearch empty response', async function() {
                let res = expect(youtubeAPI.fastSearch(query, youtubeAPIKey)).resolves.toBe(null);
                mockStream.emit('response');
                mockStream.emit('data', jsonStringEmpty);
                mockStream.emit('end');
                await res;
            });

            it('fastSearch emit error', async function() {
                let res = expect(youtubeAPI.fastSearch(query, youtubeAPIKey)).rejects.toBe('Error');
                mockStream.emit('error', 'Error');
                await res;
            });
        });
    });
});