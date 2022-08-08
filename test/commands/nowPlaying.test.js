import moment from 'moment';

import * as nowPlaying from '../../src/commands/nowPlaying.js';

import { buildProgressBar, prettifyTime } from '../../src/lib/util.js';
jest.mock('../../src/lib/util.js');

describe('commands', function () {
    describe('nowPlaying', function () {
        const guildId = 1234;

        const interaction = {
            guild: {
                id: guildId,
            },
            reply: jest.fn(),
            editReply: jest.fn(),
        };

        const np = {
            duration: moment.duration('2:30'),
            title: 'Test',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            thumbnailURL: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            requesterIconURL: 'https://cdn.discordapp.com/avatars/180995420196044809/5a5056a3d287b0f30f5add9a48b6be41.webp',
            requesterId: '180995420196044809',
        };

        const progress = moment.duration(10);

        const player = {

            conn: 'Legit Connection',
            getNowPlaying: jest.fn(() => { return np; }),
            getProgress: jest.fn(() => { return progress; }),
        };

        const players = { };
        players[guildId] = player;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('normal', async function() {
            await nowPlaying.execute(interaction, players);
            expect(player.getNowPlaying).toHaveBeenCalledTimes(1);
            expect(player.getProgress).toHaveBeenCalledTimes(1);
            expect(buildProgressBar).toHaveBeenCalledTimes(1);
            expect(prettifyTime).toHaveBeenCalledTimes(2);
        });

        it('nothing playing', async function() {
            player.getNowPlaying = jest.fn(() => { return null; });

            await nowPlaying.execute(interaction, players);
            expect(player.getNowPlaying).toHaveBeenCalledTimes(1);
            expect(player.getProgress).toHaveBeenCalledTimes(1);
            expect(buildProgressBar).toHaveBeenCalledTimes(0);
            expect(prettifyTime).toHaveBeenCalledTimes(0);
        });

        it('conn == null', async function() {
            player.conn = null;
            await nowPlaying.execute(interaction, players);
            expect(player.getNowPlaying).toHaveBeenCalledTimes(0);
            expect(player.getProgress).toHaveBeenCalledTimes(0);
        });
    });
});