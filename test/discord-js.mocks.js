import { DiscordAPIError, GuildMember } from 'discord.js';
import { AudioPlayerStatus } from '@discordjs/voice';
import { EventEmitter } from 'events';
import moment from 'moment';

import { errorCode } from '../src/lib/errors.js';

const guildId = 1234;
const searchVideoURL = 'https://www.youtube.com/watch?v=E8gmARGvPlI';

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
    clear: jest.fn(),
    connect: jest.fn(() => Promise.resolve()),
    disconnect: jest.fn(() => { return player.disconnectRetVal; }),
    dispatcher: {
        state: {
            status: AudioPlayerStatus.Playing,
        },
    },
    enqueue: jest.fn(() => { return 1; }),
    getNowPlaying: jest.fn(() => { return player.pbItem; }),
    getProgress: jest.fn(() => { return moment.duration(10); }),
    getQueueLength: jest.fn(() => { return 12; }),
    getQueue: jest.fn(() => { return queueObject; }),
    getQueueElem: jest.fn(() => { return player.pbItem; }),
    getTotalQueueTime: jest.fn(() => { return moment.duration('13:37'); }),
    getTotalRemainingPlaybackTime: jest.fn(() => { return moment.duration(0); }),
    getTimeUntil: jest.fn(() => { return moment.duration('13:37'); }),
    isConnected: jest.fn(() => { return player.connectedRetVal; }),
    isPlaying: jest.fn(() => { return player.playingRetVal; }),
    isLooping: jest.fn(() => { return false; }),
    pause: jest.fn(() => { return player.pauseRetVal; }),
    playRes: undefined,
    play: jest.fn(() => { return player.playRes; }),
    queue: {
        getLength: jest.fn(() => { return 4; }),
    },
    remove: jest.fn(() => { return player.removeRetVal; }),
    resume: jest.fn(() => { return player.resumeRetVal; }),
    seek: jest.fn(() => { return player.seekRetVal; }),
    setVolume: jest.fn(),
    shuffle: jest.fn(),
    skip: jest.fn(() => { return player.skipRetVal; }),
    stop: jest.fn(() => { return player.stopRetVal; }),
    switchLoop: jest.fn(() => { player.loop = !player.loop; }),
};

const players = {};
players[guildId] = player;

const eventCollector = new EventEmitter();
const message = {
    createMessageComponentCollector: jest.fn(() => {
        return eventCollector;
    }),
    edit: jest.fn(),
    delete: jest.fn(),
};

const guildMember = Object.create(GuildMember.prototype);
Object.defineProperty(guildMember, 'voice', {
    value: {
        channel: {
            joinable: true,
        },
    },
    writable: true,
});
guildMember.nickname = 'Test User';
guildMember.displayAvatarURL = jest.fn(() => { return 'https://cdn.discordapp.com/avatars/180995420196044809/5a5056a3d287b0f30f5add9a48b6be41.webp'; });

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
        } else if (interaction.replyErr === 2) {
            interaction.replyErr = 0;
            throw discordAPIError;
        } else {
            return message;
        }
    }),
    editReply: jest.fn(() => {
        if (interaction.replyErr === 1) {
            throw new Error();
        } else if (interaction.replyErr === 2) {
            interaction.replyErr = 0;
            throw discordAPIError;
        } else {
            return message;
        }
    }),
    stringOption: '1:25',
    volumeVal: 2,
    boolOption: false,
    options: {
        getInteger: jest.fn(() => { return interaction.integerOption; }),
        getNumber: jest.fn(() => { return interaction.volumeVal; }),
        getString: jest.fn(() => { return interaction.stringOption; }),
        getBoolean: jest.fn(() => { return interaction.boolOption; }),
    },
    member: guildMember,
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
    inCachedGuild: jest.fn(() => { return true; }),
};

const youtubeCache = [];

function resetInteraction() {
    interaction.integerOption = 1;
    interaction.member.voice.channel.joinable = true;
    interaction.stringOption = searchVideoURL;
    interaction.replied = false;
}

function resetPlayer() {
    player.conn = 'Legit Connection';
    player.loop = false;
    player.disconnectRetVal = errorCode.OK;
    player.connectedRetVal = false;
    player.playingRetVal = false;
    player.pbItem = pbItem;
    player.pauseRetVal = errorCode.OK;
    player.removeRetVal = player.pbItem;
    player.seekRetVal = errorCode.OK;
    player.skipRetVal = 'Skipped Item';
    player.stopRetVal = errorCode.OK;
    player.resumeRetVal = errorCode.OK;
    player.dispatcher.state.status = AudioPlayerStatus.Idle;
    player.playRes = undefined;
}

function resetMockObjects() {
    resetInteraction();
    resetPlayer();
}

export {
    eventCollector,
    interaction,
    pbItem,
    player,
    players,
    resetMockObjects,
    youtubeCache,
};