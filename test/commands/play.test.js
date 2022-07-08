import { AudioPlayerStatus } from '@discordjs/voice';
import moment from 'moment';

import * as play from '../../src/commands/play.js';
import { HTTPError } from '../../src/lib/errors.js';

global.console.trace = jest.fn();

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

const pb = {
    duration: moment.duration('2:30'),
    channelTitle: 'Vevo',
    title: 'Test',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailURL: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    requesterIconURL: '',
    requesterId: '',
    isAgeRestricted: false,
};
var mockHandleVideoRes = pb;

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
                url: '',
            },
        },
        channelTitle: 'Wham Vevo',
        itemCount: '',
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
        const guildId = 1234;
        const youtubeAPIKey = null;
        const searchVideoURL = 'https://www.youtube.com/watch?v=E8gmARGvPlI';
        const searchPlaylistURL = 'https://www.youtube.com/playlist?list=PLe8jmEHFkvsaAg_ghHeW8euGDwAKHfzJb';
        const searchFileURL = 'https://static.wikia.nocookie.net/smite_gamepedia/images/d/db/ClassyFenrir_Ability_2a.ogg';
        const searchString = 'last christmas';
        var searchQuery = searchVideoURL;

        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
            editReply: jest.fn(),
            options: {
                getString: jest.fn(() => { return searchQuery; }),
            },
            member: {
                displayAvatarURL: jest.fn(),
                voice: {
                    channel: {
                        joinable: true,
                    },
                },
            },
            user: {
                id: '',
            },
            channel: {
                send: jest.fn(),
            },
        };

        var playRes = undefined;
        const player = {
            conn: 'Legit Connection',
            dispatcher: {
                state: {
                    status: AudioPlayerStatus.Playing,
                },
            },
            connect: jest.fn(),
            play: jest.fn(() => { return playRes; }),
            enqueue: jest.fn(),
            getTotalRemainingPlaybackTime: jest.fn(() => { return moment.duration(0); }),
            queue: {
                getLength: jest.fn(() => { return 4; }),
            },
        };

        var pbRes = undefined;

        const players = { };
        players[guildId] = player;

        const youtubeCache = {
            get: jest.fn(() => { return pbRes; }),
            push: jest.fn(),
        };

        beforeEach(() => {
            jest.clearAllMocks();

            searchQuery = searchVideoURL;
            player.dispatcher.state.status = AudioPlayerStatus.Idle;
            pbRes = undefined;
            mockFastSearchRes = fastSearchElem;
            mockFastSearchError = false;
            mockPlaylistItemsError = false;
            mockHandleVideoError = false;
            mockPlaylistInfoError = false;
            mockGetYTidRes = ytIdVal;
            mockHandleVideoRes = pb;
            playRes = undefined;
            pb.isAgeRestricted = false;
        });

        it('normal first play with url, nothing cached', async function() {
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(player.enqueue).toHaveBeenCalledTimes(1);
            expect(player.play).toHaveBeenCalledTimes(1);
        });

        it('first play with url, nothing cached, playRes == 1', async function() {
            playRes = 1;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(player.enqueue).toHaveBeenCalledTimes(1);
            expect(player.play).toHaveBeenCalledTimes(1);
        });

        it('first play with url, nothing cached, playRes == 2', async function() {
            playRes = 2;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(player.enqueue).toHaveBeenCalledTimes(1);
            expect(player.play).toHaveBeenCalledTimes(1);
        });

        it('first play with url, nothing cached, pb none', async function() {
            mockHandleVideoRes = undefined;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(player.enqueue).toHaveBeenCalledTimes(1);
            expect(player.play).toHaveBeenCalledTimes(1);
        });

        it('second play with url, nothing cached, pb none', async function() {
            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            mockHandleVideoRes = undefined;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(0);
            expect(player.enqueue).toHaveBeenCalledTimes(0);
            expect(player.play).toHaveBeenCalledTimes(0);
        });

        it('normal first play with url, cached', async function() {
            pbRes = pb;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(player.enqueue).toHaveBeenCalledTimes(1);
            expect(player.play).toHaveBeenCalledTimes(1);
        });

        it('age-restricted first play with url, cached', async function() {
            pbRes = pb;
            pb.isAgeRestricted = true;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache, false);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(player.enqueue).toHaveBeenCalledTimes(0);
            expect(player.play).toHaveBeenCalledTimes(0);
        });

        it('age-restricted second play with url, nothing cached', async function() {
            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            pb.isAgeRestricted = true;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache, false);
            expect(player.connect).toHaveBeenCalledTimes(0);
            expect(player.enqueue).toHaveBeenCalledTimes(0);
            expect(player.play).toHaveBeenCalledTimes(0);
        });

        it('normal second play with url, nothing cached', async function() {
            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(0);
            expect(player.enqueue).toHaveBeenCalledTimes(1);
            expect(player.play).toHaveBeenCalledTimes(0);
        });

        it('normal second play with url, cached', async function() {
            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            pbRes = pb;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(0);
            expect(player.enqueue).toHaveBeenCalledTimes(1);
            expect(player.play).toHaveBeenCalledTimes(0);
        });

        it('age-restricted second play with url, cached', async function() {
            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            pbRes = pb;
            pb.isAgeRestricted = true;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache, false);
            expect(player.connect).toHaveBeenCalledTimes(0);
            expect(player.enqueue).toHaveBeenCalledTimes(0);
            expect(player.play).toHaveBeenCalledTimes(0);
        });


        it('normal first play with string, nothing cached', async function() {
            searchQuery = searchString;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(player.enqueue).toHaveBeenCalledTimes(1);
            expect(player.play).toHaveBeenCalledTimes(1);
        });

        it('normal first play with string, nothing cached, fastSearch fail', async function() {
            searchQuery = searchString;
            mockFastSearchRes = undefined;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(player.enqueue).toHaveBeenCalledTimes(0);
            expect(player.play).toHaveBeenCalledTimes(0);
        });

        it('normal first play with string, nothing cached, fastSearch error', async function() {
            searchQuery = searchString;
            mockFastSearchError = true;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(player.enqueue).toHaveBeenCalledTimes(0);
            expect(player.play).toHaveBeenCalledTimes(0);
        });

        it('playlist first play, nothing cached', async function() {
            searchQuery = searchPlaylistURL;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(player.enqueue).toHaveBeenCalledTimes(1);
            expect(player.play).toHaveBeenCalledTimes(1);
        });

        it('playlist first play, nothing cached, playlistItems error', async function() {
            searchQuery = searchPlaylistURL;
            mockPlaylistItemsError = true;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(player.enqueue).toHaveBeenCalledTimes(0);
            expect(player.play).toHaveBeenCalledTimes(0);
        });

        it('playlist second play, nothing cached', async function() {
            searchQuery = searchPlaylistURL;
            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(0);
            expect(player.enqueue).toHaveBeenCalledTimes(0);
            expect(player.play).toHaveBeenCalledTimes(0);
        });

        it('playlist callback, playlistInfo error', async function() {
            searchQuery = searchPlaylistURL;
            mockPlaylistInfoError = true;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(player.enqueue).toHaveBeenCalledTimes(1);
            expect(player.play).toHaveBeenCalledTimes(1);
        });

        it('file first play', async function() {
            searchQuery = searchFileURL;
            mockGetYTidRes = undefined;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(player.enqueue).toHaveBeenCalledTimes(1);
            expect(player.play).toHaveBeenCalledTimes(1);
        });

        it('file first play, handleVideo error', async function() {
            mockHandleVideoError = true;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(1);
            expect(player.enqueue).toHaveBeenCalledTimes(1);
            expect(player.play).toHaveBeenCalledTimes(1);
        });

        it('not joinable', async function() {
            interaction.member.voice.channel.joinable = false;
            await play.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(player.connect).toHaveBeenCalledTimes(0);
            expect(player.enqueue).toHaveBeenCalledTimes(0);
            expect(player.play).toHaveBeenCalledTimes(0);
        });
    });
});