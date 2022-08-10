import { eventCollector, interaction, player, players, youtubeCache } from '../discord-js.mocks.js';

import * as searchCmd from '../../src/commands/search.js';

import { HTTPError } from '../../src/lib/errors.js';
import { selectMenus } from '../../src/lib/componentIDs.js';

import { AudioPlayerStatus } from '@discordjs/voice';

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

const mockHTTPErr = new HTTPError('', '');
var mockSearchRes = undefined;
var mockSearchError = false;

// eslint-disable-next-line no-unused-vars
import { search } from '../../src/lib/youtubeAPI.js';
jest.mock('../../src/lib/youtubeAPI.js', () => {
    return {
        search: jest.fn(() => {
            if (mockSearchError) {
                throw mockHTTPErr;
            } else {
                return mockSearchRes;
            }
        }),
    };
});

// eslint-disable-next-line no-unused-vars
import { createPlayEmbed, playItem } from '../../src/lib/playbackHelpers.js';
jest.mock('../../src/lib/playbackHelpers.js', () => {
    return {
        playItem: jest.fn(),
        createPlayEmbed: jest.fn(),
    };
});

var mockHandleVideoError = false;
var mockHandleVideoRes = {};

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

// eslint-disable-next-line no-unused-vars
import { errorReply, handleVideo } from '../../src/lib/util.js';
jest.mock('../../src/lib/util.js', () => {
    return {
        errorReply: jest.fn(),
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

describe('commands', function () {
    describe('search', function () {
        const youtubeAPIKey = null;

        const searchResVal = {
            results: [
                {
                    title: 'Test',
                    channelTitle: 'TesterChann',
                    id: 'gsaohqu3252038hog',
                },
            ],
        };

        const selectMenu = {
            customId: selectMenus.searchMenu,
            deferUpdate: jest.fn(),
            values: [],
            member: {
                displayAvatarURL: jest.fn(),
            },
            editReply: jest.fn(),
        };

        beforeEach(() => {
            jest.clearAllMocks();

            interaction.member.voice.channel.joinable = true;
            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            mockSearchError = false;
            mockSearchRes = searchResVal;
            selectMenu.customId = selectMenus.searchMenu;
            interaction.integerOption = 2;
            mockHandleVideoError = false;
        });

        it('normal', async function() {
            player.dispatcher.state.status = AudioPlayerStatus.Paused;
            await searchCmd.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(search).toBeCalledTimes(1);
        });

        it('normal, no amount provided', async function() {
            player.dispatcher.state.status = AudioPlayerStatus.Paused;
            interaction.integerOption = 0;
            await searchCmd.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(search).toBeCalledTimes(1);
        });

        it('voice channel not joinable', async function() {
            interaction.member.voice.channel.joinable = false;
            await searchCmd.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(search).toBeCalledTimes(0);
        });

        it('no results', async function() {
            mockSearchRes = {};
            let res = searchCmd.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(res).rejects.toThrow();
        });

        it('search exception', async function() {
            mockSearchError = true;
            await searchCmd.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(search).toBeCalledTimes(1);
        });

        it('search res null', async function() {
            mockSearchRes = null;
            await searchCmd.execute(interaction, players, youtubeAPIKey, youtubeCache);
            expect(search).toBeCalledTimes(1);
        });

        it('test collect', async function() {
            let res = searchCmd.execute(interaction, players, youtubeAPIKey, youtubeCache);
            eventCollector.emit('collect', selectMenu);
            await res;
            expect(search).toBeCalledTimes(1);
        });

        it('test collect, wrong id', async function() {
            selectMenu.customId = 'asdtgjs';
            let res = searchCmd.execute(interaction, players, youtubeAPIKey, youtubeCache);
            eventCollector.emit('collect', selectMenu);
            await res;
            expect(search).toBeCalledTimes(1);
        });

        it('test collect, handle video err', async function() {
            mockHandleVideoError = true;
            let res = searchCmd.execute(interaction, players, youtubeAPIKey, youtubeCache);
            eventCollector.emit('collect', selectMenu);
            await res;
            expect(search).toBeCalledTimes(1);
        });

        it('test end', async function() {
            let res = searchCmd.execute(interaction, players, youtubeAPIKey, youtubeCache);
            eventCollector.emit('end', '');
            await res;
            expect(search).toBeCalledTimes(1);
        });

        it('test end selected', async function() {
            let res = searchCmd.execute(interaction, players, youtubeAPIKey, youtubeCache);
            eventCollector.emit('collect', selectMenu);
            eventCollector.emit('end', '');
            await res;
            expect(search).toBeCalledTimes(1);
        });
    });
});