import { interaction, pbItem, player, players } from '../discord-js.mocks.js';

import { AudioPlayerStatus } from '@discordjs/voice';

import * as play from '../../src/commands/play.js';
import { HTTPError } from '../../src/lib/errors.js';

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

var mockHandleVideoError = false;

const ytIdVal = 'E8gmARGvPlI';
var mockGetYTidRes = ytIdVal;

var mockHandleVideoRes = pbItem;

// eslint-disable-next-line no-unused-vars
import { errorReply, getYTid, handlePlaylist, handleVideo, prettifyTime } from '../../src/lib/util.js';
jest.mock('../../src/lib/util.js', () => {
    return {
        errorReply: jest.fn(),
        getAudioDurationInSeconds: jest.fn(),
        getYTid: jest.fn(() => { return mockGetYTidRes; }),
        handlePlaylist: jest.fn((_player, _playlistId, _member, _skip, cb) => { cb(); }),
        handleVideo: jest.fn(async () => {
            if (mockHandleVideoError) {
                throw mockAxiosErr;
            } else {
                return Promise.resolve(mockHandleVideoRes);
            }
        }),
        prettifyTime: jest.fn(() => { return '2:30'; }),
    };
});

var mockPlayItemRes = 0;

// eslint-disable-next-line no-unused-vars
import { createPlayEmbed, playItem } from '../../src/lib/playbackHelpers.js';
jest.mock('../../src/lib/playbackHelpers.js', () => {
    return {
        createPlayEmbed: jest.fn(),
        playItem: jest.fn(() => {
            return mockPlayItemRes;
        }),
    };
});

const fastSearchElem = {
    url: '',
    id: '',
    title: '',
};
const mockHTTPErr = new HTTPError('', '');
var mockFastSearchRes = undefined;
var mockFastSearchError = false;

const mockPlaylistInfoRes = {
    results: [{
        title: 'Last Christmas',
        thumbnails: {
            maxres: {
                url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            },
        },
        channelTitle: 'Wham Vevo',
        itemCount: '4',
    }],
};
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
var mockPlaylistInfoError = false;

const mockPlaylistItemsRes = {
    results: [{ videoId: '', title: '' }],
};
var mockPlaylistItemsError = false;

// eslint-disable-next-line no-unused-vars
import { fastSearch, playlistInfo, playlistItems } from '../../src/lib/youtubeAPI.js';
jest.mock('../../src/lib/youtubeAPI.js', () => {
    return {
        fastSearch: jest.fn(() => {
            if (mockFastSearchError) {
                throw mockHTTPErr;
            } else {
                return mockFastSearchRes;
            }
        }),
        playlistInfo: jest.fn(() => {
            if (mockPlaylistInfoError) {
                throw mockAxiosErr;
            } else {
                return mockPlaylistInfoRes;
            }
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

describe('commands', function () {
    describe('play', function () {
        const youtubeAPIKey = null;
        const searchVideoURL = 'https://www.youtube.com/watch?v=E8gmARGvPlI';
        const searchPlaylistURL = 'https://www.youtube.com/playlist?list=PLe8jmEHFkvsaAg_ghHeW8euGDwAKHfzJb';
        const searchFileURL = 'https://static.wikia.nocookie.net/smite_gamepedia/images/d/db/ClassyFenrir_Ability_2a.ogg';
        const searchString = 'last christmas';
        var pbRes = undefined;

        const youtubeCache = {
            get: jest.fn(() => { return pbRes; }),
            push: jest.fn(),
        };

        beforeEach(() => {
            jest.clearAllMocks();

            player.dispatcher.state.status = AudioPlayerStatus.Idle;
            player.loop = false;
            pbRes = undefined;
            mockFastSearchRes = fastSearchElem;
            mockFastSearchError = false;
            mockPlaylistItemsError = false;
            mockHandleVideoError = false;
            mockPlaylistInfoError = false;
            mockGetYTidRes = ytIdVal;
            mockHandleVideoRes = pbItem;
            mockPlayItemRes = 0;
            player.playRes = undefined;
            pbItem.isAgeRestricted = false;

            interaction.stringOption = searchVideoURL;
            interaction.replied = false;
        });

        it('normal first play with url, nothing cached', async function() {
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('playItem fail, first play with url, nothing cached', async function() {
            mockPlayItemRes = -1;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('first play with url, nothing cached, playRes == 1', async function() {
            player.playRes = 1;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('first play with url, nothing cached, playRes == 2', async function() {
            player.playRes = 2;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('first play with url, nothing cached, pb none', async function() {
            mockHandleVideoRes = undefined;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('second play with url, nothing cached, pb none', async function() {
            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            mockHandleVideoRes = undefined;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(0);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('normal first play with url, cached', async function() {
            pbRes = pbItem;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('age-restricted first play with url, cached', async function() {
            pbRes = pbItem;
            pbItem.isAgeRestricted = true;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache, false);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('age-restricted second play with url, nothing cached', async function() {
            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            pbItem.isAgeRestricted = true;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache, false);
            expect(player.connect).toHaveBeenCalledTimes(0);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('normal second play with url, nothing cached', async function() {
            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(0);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('normal second play with url, nothing cached, loop', async function() {
            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            player.loop = true;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(0);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('normal second play with url, cached', async function() {
            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            pbRes = pbItem;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(0);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('age-restricted second play with url, cached', async function() {
            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            pbRes = pbItem;
            pbItem.isAgeRestricted = true;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache, false);
            expect(player.connect).toHaveBeenCalledTimes(0);
            expect(playItem).toHaveBeenCalledTimes(1);
        });


        it('normal first play with string, nothing cached', async function() {
            interaction.stringOption = searchString;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('normal first play with string, nothing cached, fastSearch fail', async function() {
            interaction.stringOption = searchString;
            mockFastSearchRes = undefined;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(playItem).toHaveBeenCalledTimes(0);
        });

        it('normal first play with string, nothing cached, fastSearch error', async function() {
            interaction.stringOption = searchString;
            mockFastSearchError = true;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(playItem).toHaveBeenCalledTimes(0);
        });

        it('playlist first play, nothing cached', async function() {
            interaction.stringOption = searchPlaylistURL;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('playlist first play, nothing cached, playlistItems error', async function() {
            interaction.stringOption = searchPlaylistURL;
            mockPlaylistItemsError = true;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(playItem).toHaveBeenCalledTimes(0);
            expect(handlePlaylist).toHaveBeenCalledTimes(0);
        });

        it('playlist second play, nothing cached', async function() {
            interaction.stringOption = searchPlaylistURL;
            interaction.replied = true;
            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(0);
            expect(handlePlaylist).toHaveBeenCalledTimes(1);
        });

        it('playlist callback, playlistInfo error', async function() {
            interaction.stringOption = searchPlaylistURL;
            mockPlaylistInfoError = true;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('file first play', async function() {
            interaction.stringOption = searchFileURL;
            mockGetYTidRes = undefined;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('file first play, handleVideo error', async function() {
            mockHandleVideoError = true;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(playItem).toHaveBeenCalledTimes(1);
        });

        it('not joinable', async function() {
            interaction.member.voice.channel.joinable = false;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(0);
            expect(playItem).toHaveBeenCalledTimes(0);
        });
    });
});