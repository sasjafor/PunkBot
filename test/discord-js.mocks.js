import { AudioPlayerStatus } from '@discordjs/voice';
import { DiscordAPIError } from 'discord.js';
import { EventEmitter } from 'events';
import moment from 'moment';

const guildId = 1234;

const pbItem = {
    duration: moment.duration('2:30'),
    channelTitle: 'BestChannel',
    title: 'Test',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailURL: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    requesterIconURL: 'https://cdn.discordapp.com/avatars/180995420196044809/5a5056a3d287b0f30f5add9a48b6be41.webp',
    requesterId: '180995420196044809',
    isAgeRestricted: false,
    isYT: true,
};

const queueObject = {
    get: jest.fn(() => { return pbItem; }),
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
    enqueue: jest.fn(() => { return 1; }),
    getNowPlaying: jest.fn(() => { return pbItem; }),
    getProgress: jest.fn(() => { return moment.duration(10); }),
    getQueueLength: jest.fn(() => { return 12; }),
    getQueue: jest.fn(() => { return queueObject; }),
    getTotalQueueTime: jest.fn(() => { return moment.duration('13:37'); }),
    getTotalRemainingPlaybackTime: jest.fn(() => { return moment.duration(0); }),
    getTimeUntil: jest.fn(() => { return moment.duration('13:37'); }),
    pauseRetVal: 0,
    pause: jest.fn(() => { return player.pauseRetVal; }),
    playRes: undefined,
    play: jest.fn(() => { return player.playRes; }),
    queue: {
        getLength: jest.fn(() => { return 4; }),
    },
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
    edit: jest.fn(),
    delete: jest.fn(),
};

const discordAPIError = Object.create(DiscordAPIError.prototype);
discordAPIError.message = 'Interaction has already been acknowledged.';

const interaction = {
    guild: {
        id: guildId,
    },
    replyErr: 0,
    reply: jest.fn(() => {
        if (interaction.replyErr === 1) {
            throw new Error();
        } else if(interaction.replyErr === 2) {
            interaction.replyErr = 0;
            throw discordAPIError;
        } else {
            return message;
        }
    }),
    editReply: jest.fn(() => {
        if (interaction.replyErr === 1) {
            throw new Error();
        } else if(interaction.replyErr === 2) {
            interaction.replyErr = 0;
            throw discordAPIError;
        } else {
            return message;
        }
    }),
    integerOption: 2,
    stringOption: '1:25',
    volumeVal: 2,
    boolOption: false,
    options: {
        getInteger: jest.fn(() => { return interaction.integerOption; }),
        getNumber: jest.fn(() => { return interaction.volumeVal; }),
        getString: jest.fn(() => { return interaction.stringOption; }),
        getBoolean: jest.fn(() => { return interaction.boolOption; }),
    },
    member: {
        displayAvatarURL: jest.fn(() => { return 'https://cdn.discordapp.com/avatars/180995420196044809/5a5056a3d287b0f30f5add9a48b6be41.webp'; }),
        voice: {
            channel: {
                joinable: true,
            },
        },
    },
    user: {
        id: '180995420196044809',
    },
    channel: {
        send: jest.fn(),
    },
    isRepliable: jest.fn(() => {
        return true;
    }),
    replied: false,
};

const youtubeCache = [];

export {
    eventCollector,
    interaction,
    pbItem,
    player,
    players,
    youtubeCache,
};