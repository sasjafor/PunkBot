import moment from 'moment';

import { DiscordAPIError } from 'discord.js';

import * as util from '../../src/lib/util.js';

jest.mock('winston', () => ({
    format: {
        colorize: jest.fn(),
        combine: jest.fn(),
        errors: jest.fn(),
        label: jest.fn(),
        printf: jest.fn(),
        timestamp: jest.fn(),
    },
    createLogger: jest.fn().mockReturnValue({
        debug: jest.fn(),
        error: jest.fn(),
    }),
    transports: {
        Console: jest.fn(),
    },
}));

const mockAxiosErr = {
    name: '',
    message: '',
    response: {
        data: {
            error: {
                message: '',
            },
        },
    },
};

const mockVideoInfo = {
    results: [
        {
            title: '',
            thumbnails: {
                maxres: {
                    url: '',
                },
                standard: {
                    url: '',
                },
            },
            duration: '',
            channelTitle: '',
            contentRating: {
                ytRating: 'ytAgeRestricted',
            }
        },
    ],
};
var mockVideoInfoRes = mockVideoInfo;

const pageInfo = {
    nextPageToken: '',
};
const mockPlaylistItemsRes = {
    pageInfo: pageInfo,
    results: [
        {
            videoId: '1235',
            title: '',
        },
    ],
};
var mockPlaylistItemsError = false;

// eslint-disable-next-line no-unused-vars
import { playlistItems, videoInfo } from '../../src/lib/youtubeAPI.js';
jest.mock('../../src/lib/youtubeAPI.js', () => {
    return {
        videoInfo: jest.fn(() => {
            return mockVideoInfoRes;
        }),
        playlistItems: jest.fn(() => {
            if (mockPlaylistItemsError) {
                throw mockAxiosErr;
            } else {
                return mockPlaylistItemsRes;
            }
        }),
    };
});

const durationString = 'duration=320.0';
var mockDurationStringRes = durationString;
import { execa } from 'execa';
jest.mock('execa', () => {
    return {
        execa: jest.fn(() => {
            return Promise.resolve({ stdout: mockDurationStringRes });
        }),
    };
});

global.console.trace = jest.fn();

describe('lib', function () {
    describe('util', function () {
        describe('errorReply', function () {
            const msgContent = 'Test err';
            const errorMessage = 'Error Error';
            const url = 'https://www.youtube.com/watch?v=E8gmARGvPlI';
            const avatarURL = 'https://media.wired.com/photos/5a15e608801bd64d76805764/4:3/w_408,h_306,c_limit/rickastley.jpg';

            const discordAPIError = Object.create(DiscordAPIError.prototype);
            discordAPIError.message = 'Interaction has already been acknowledged.';

            const interaction = {
                member: {
                    displayAvatarURL: jest.fn(),
                },
                replied: false,
                reply: jest.fn(() => {
                    if (replyErr === 1) {
                        throw new Error();
                    } else if(replyErr === 2) {
                        throw discordAPIError;
                    }
                }),
                editReply: jest.fn(),
            };

            const channel = {
                send: jest.fn(),
            };

            var msgContentVal = msgContent;
            var replyErr = 0;
            var interactionVal = interaction;

            beforeEach(() => {
                jest.clearAllMocks();

                interaction.replied = false;
                msgContentVal = msgContent;
                replyErr = 0;
                interactionVal = interaction;
            });

            it('normal', async function() {
                await util.errorReply(interactionVal, msgContentVal, errorMessage, url);
                expect(interaction.reply).toBeCalledTimes(1);
                expect(interaction.editReply).toBeCalledTimes(0);
            });

            it('interaction.replied == true', async function() {
                interaction.replied = true;
                await util.errorReply(interactionVal, msgContentVal, errorMessage, url);
                expect(interaction.reply).toBeCalledTimes(0);
                expect(interaction.editReply).toBeCalledTimes(1);
            });

            it('reply normal error', async function() {
                replyErr = 1;
                await util.errorReply(interactionVal, msgContentVal, errorMessage, url);
                expect(interaction.reply).toBeCalledTimes(1);
                expect(interaction.editReply).toBeCalledTimes(0);
            });

            it('reply api error', async function() {
                replyErr = 2;
                await util.errorReply(interactionVal, msgContentVal, errorMessage, url);
                expect(interaction.reply).toBeCalledTimes(1);
                expect(interaction.editReply).toBeCalledTimes(1);
            });

            it('msgContent == null', async function() {
                msgContentVal = undefined;
                await util.errorReply(interactionVal, msgContentVal, errorMessage, url);
                expect(interaction.reply).toBeCalledTimes(1);
                expect(interaction.editReply).toBeCalledTimes(0);
            });

            it('interaction == null', async function() {
                interactionVal = undefined;
                await util.errorReply(interactionVal, msgContentVal, errorMessage, url, channel, avatarURL);
                expect(interaction.reply).toBeCalledTimes(0);
                expect(interaction.editReply).toBeCalledTimes(0);
                expect(channel.send).toBeCalledTimes(1);
            });
        });

        describe('prettifyTime', function() {
            const duration1 = moment.duration(0);
            const duration2 = moment.duration('20:42:24');

            beforeEach(() => {
                jest.clearAllMocks();
            });

            it('normal', function() {
                let prettyTime = util.prettifyTime(duration1);
                expect(prettyTime).toBe('00:00');
            });

            it('with hours', function() {
                let prettyTime = util.prettifyTime(duration2);
                expect(prettyTime).toBe('20:42:24');
            });

            it('error', function() {
                expect(() => util.prettifyTime()).toThrow();
            });
        });

        describe('buildProgressBar', function() {
            const progress1 = moment.duration('4:20');
            const progress2 = moment.duration('20:42:24');
            const totalTime = moment.duration('13:37');

            const progressBarRes1 = '▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';
            const progressBarRes2 = '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘';

            beforeEach(() => {
                jest.clearAllMocks();
            });

            it('normal', function() {
                let res = util.buildProgressBar(progress1, totalTime);
                expect(res).toBe(progressBarRes1);
            });

            it('progress > totalTime', function() {
                let res = util.buildProgressBar(progress2, totalTime);
                expect(res).toBe(progressBarRes2);
            });

        });

        describe('getYTid', function() {
            const url1 = 'https://www.youtube.com/watch?v=E8gmARGvPlI';
            const url2 = 'https://soundcloud.com/monstercat/bossfight-warp';

            const id1 = 'E8gmARGvPlI';

            beforeEach(() => {
                jest.clearAllMocks();
            });

            it('normal', function() {
                let res = util.getYTid(url1);
                expect(res).toBe(id1);
            });

            it('non YT url', function() {
                let res = util.getYTid(url2);
                expect(res).toBeFalsy();
            });
        });

        describe('handleVideo', function() {
            const id = 'E8gmARGvPlI';
            const requester = {
                displayName: 'Tester',
                user: {
                    id: '1',
                },
                displayAvatarURL: jest.fn(),
            };
            const url = 'https://www.youtube.com/watch?v=E8gmARGvPlI';
            const title = 'Test';
            const youtubeAPIKey = '1245';

            beforeEach(() => {
                jest.clearAllMocks();

                mockVideoInfoRes = mockVideoInfo;
            });

            it('normal', async function() {
                let _res = await util.handleVideo(id, requester, url, title, youtubeAPIKey);
                expect(videoInfo).toBeCalledTimes(1);
            });

            it('videoInfo returns null', async function() {
                mockVideoInfoRes = null;
                expect(util.handleVideo(id, requester, url, title, youtubeAPIKey)).rejects.toThrow();
                expect(videoInfo).toBeCalledTimes(1);
            });

            it('videoInfo returns null', async function() {
                let _res = await util.handleVideo(null, requester, url, title, youtubeAPIKey);
                expect(videoInfo).toBeCalledTimes(0);
            });
        });

        describe('handlePlaylist', function() {
            const player = {
                enqueue: jest.fn(),
            };
            const id = 'E8gmARGvPlI';
            const requester = {
                displayName: 'Tester',
                user: {
                    id: '1',
                },
                displayAvatarURL: jest.fn(),
            };
            var skipFirst = false;
            const callback = jest.fn();
            const channel = {
                send: jest.fn(),
            };
            const avatarURL = '';
            const youtubeAPIKey = '1245';

            beforeEach(() => {
                jest.clearAllMocks();

                skipFirst = false;
                mockPlaylistItemsError = false;
                mockVideoInfoRes = mockVideoInfo;
                mockPlaylistItemsRes.pageInfo = pageInfo;
            });

            it('normal', async function() {
                let _res = await util.handlePlaylist(player, id, requester, skipFirst, callback, channel, avatarURL, youtubeAPIKey);
                expect(playlistItems).toBeCalledTimes(1);
            });

            it('skip first', async function() {
                skipFirst = true;
                let _res = await util.handlePlaylist(player, id, requester, skipFirst, callback, channel, avatarURL, youtubeAPIKey);
                expect(playlistItems).toBeCalledTimes(1);
            });

            it('playlistItems error', async function() {
                mockPlaylistItemsError = true;
                let res = await util.handlePlaylist(player, id, requester, skipFirst, callback, channel, avatarURL, youtubeAPIKey);
                expect(playlistItems).toBeCalledTimes(1);
                expect(res).toBeFalsy();
            });

            it('handleVideo error', async function() {
                mockVideoInfoRes = null;
                let res = await util.handlePlaylist(player, id, requester, skipFirst, callback, channel, avatarURL, youtubeAPIKey);
                expect(playlistItems).toBeCalledTimes(1);
                expect(res).toBeFalsy();
            });

            it('pageInfo null', async function() {
                delete mockPlaylistItemsRes.pageInfo;
                let res = await util.handlePlaylist(player, id, requester, skipFirst, callback, channel, avatarURL, youtubeAPIKey);
                expect(playlistItems).toBeCalledTimes(1);
                expect(res).toBeFalsy();
            });
        });

        describe('getAudioDurationInSeconds', function() {
            const url = 'https://www.youtube.com/watch?v=E8gmARGvPlI';

            beforeEach(() => {
                jest.clearAllMocks();

                mockDurationStringRes = durationString;
            });

            it('normal', async function() {
                let _res = await util.getAudioDurationInSeconds(url);
                expect(execa).toBeCalledTimes(1);
            });

            it('no match', async function() {
                mockDurationStringRes = '';
                let _res = await util.getAudioDurationInSeconds(url);
                expect(execa).toBeCalledTimes(1);
            });
        });
    });
});