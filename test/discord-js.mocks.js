import { AudioPlayerStatus } from '@discordjs/voice';
import { EventEmitter } from 'events';
import moment from 'moment';

const guildId = 1234;

const np = {
    duration: moment.duration('2:30'),
    title: 'Test',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailURL: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    requesterIconURL: 'https://cdn.discordapp.com/avatars/180995420196044809/5a5056a3d287b0f30f5add9a48b6be41.webp',
    requesterId: '180995420196044809',
};

const queueObject = {
    get: jest.fn(() => { return np; }),
};

const player = {
    conn: 'Legit Connection',
    loop: false,
    clear: jest.fn(),
    connect: jest.fn(() => Promise.resolve()),
    disconnect: jest.fn(() => { return true; }),
    dispatcher: {
        state: {
            status: AudioPlayerStatus.Playing,
        },
    },
    getNowPlaying: jest.fn(() => { return np; }),
    getProgress: jest.fn(() => { return moment.duration(10); }),
    getQueueLength: jest.fn(() => { return 12; }),
    getQueue: jest.fn(() => { return queueObject; }),
    getTotalQueueTime: jest.fn(() => { return moment.duration('13:37'); }),
    pauseRetVal: 0,
    pause: jest.fn(() => { return player.pauseRetVal; }),
    remove: jest.fn(() => { return true; }),
    resumeRetVal: 0,
    resume: jest.fn(() => { return player.resumeRetVal; }),
    seek: jest.fn(),
    setVolume: jest.fn(),
    shuffle: jest.fn(),
    skip: jest.fn(() => { return true; }),
    stopRetVal: 0,
    stop: jest.fn(() => { return player.stopRetVal; }),
};

const players = { };
players[guildId] = player;

const eventCollector = new EventEmitter();
const message = {
    createMessageComponentCollector: jest.fn(() => {
        return eventCollector;
    }),
};

const interaction = {
    guild: {
        id: guildId,
    },
    reply: jest.fn(),
    editReply: jest.fn(() => {
        return message;
    }),
    integerOption: 2,
    stringOption: '1:25',
    volumeVal: 2,
    options: {
        getInteger: jest.fn(() => { return interaction.integerOption; }),
        getNumber: jest.fn(() => { return interaction.volumeVal; }),
        getString: jest.fn(() => { return interaction.stringOption; }),
    },
    member: {
        displayAvatarURL: jest.fn(),
        voice: {
            channel: {
                joinable: true,
            },
        },
    },
};

export {
    eventCollector,
    interaction,
    player,
    players,
};