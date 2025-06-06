import fs from 'fs';

import {
    Client,
    Collection,
    GatewayIntentBits,
    GuildMember,
    PermissionFlagsBits,
    TextChannel,
} from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { URL } from 'url';

import { PlayerDict, SlashCommand } from './types.js';
import axios from 'axios';
import { errorReply } from './lib/util.js';
import { LimitedDict } from './lib/limitedDict.js';
import { logger } from './lib/log.js';
import { PlaybackItem } from './lib/playbackItem.js';
import { Player } from './lib/player.js';
import { strings } from './lib/messageStrings.js';

if (process.env.DISCORD_APP_AUTH_TOKEN === undefined) {
    logger.error('Please set the environment variable DISCORD_APP_AUTH_TOKEN');
    process.exit(1);
}
const token: string = process.env.DISCORD_APP_AUTH_TOKEN;
if (process.env.YOUTUBE_API_KEY === undefined) {
    logger.error('Please set the environment variable YOUTUBE_API_KEY');
    process.exit(1);
}
const youtubeAPIKey = process.env.YOUTUBE_API_KEY;
const client = new Client({ intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });

const hasYoutubeCookies = fs.existsSync('./.data/youtube.data');

const players: PlayerDict = {};
const youtubeCache = new LimitedDict<PlaybackItem>(100);
const commands: Collection<string, SlashCommand> = new Collection();
const commandFilesPath = new URL('./commands', import.meta.url).pathname;
const commandFiles = fs.readdirSync(commandFilesPath).filter(file => file.endsWith('.js'));

const commandJSONs: string[] = [];

// Healthcheck
const interval = 5 * 60 * 1000;
function sendOk(): void {
    axios.get('https://hc-ping.com/236131b4-0bd8-48cf-a501-399ef23dcf46');
}
sendOk();
setInterval(sendOk, interval);

async function importCommands(): Promise<void> {
    for (const file of commandFiles) {
        const command = await import(`./commands/${file}`);
        // Set a new item in the Collection
        // With the key as the command name and the value as the exported module
        commands.set(command.data.name, command);
        // Add command JSON to list
        commandJSONs.push(command.data.toJSON());
    }
}
importCommands();

async function login(): Promise<void> {
    try {
        await client.login(token);
    } catch (error) {
        logger.error(error);
    }
}
login();

client.on('ready', async () => {
    logger.info('Connected as ' + client.user?.username);

    await registerCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = commands.get(interaction.commandName);

    if (!command) {
        return;
    }

    if (!(interaction.member instanceof GuildMember)) {
        logger.debug('Member was not of GuildMember type');
        return;
    }

    if (!interaction.member || !interaction.member.voice.channel) {
        await interaction.reply({ content: strings.needToBeInVoice });
        return;
    }

    const guildId = interaction.guildId;
    if (guildId === null) {
        return;
    }

    let player = players[guildId];
    if (!player) {
        player = players[guildId] = new Player();
    }

    const options = interaction.options;
    const silentVal = options.getBoolean('silent');
    const isSilent = silentVal === null ? false : silentVal;

    try {
        await interaction.deferReply({ ephemeral: isSilent });
        await command.execute(interaction, players, youtubeAPIKey, youtubeCache, hasYoutubeCookies);
    } catch (error) {
        logger.error(error);
        errorReply(interaction, error.message);
    }
});

client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) {
        return;
    }

    if (message.content[0] === '!') {
        if (!(message.channel instanceof TextChannel) ||
            message.guild.members.me === null ||
            !message.channel.permissionsFor(message.guild.members.me).has(PermissionFlagsBits.SendMessages)) {
            return;
        }

        if (message.content === '!register') {
            await registerCommands();
            message.channel.send({ content: strings.successfullyRegisteredCommands });
        } else {
            message.channel.send({ content: strings.switchToSlashCommands });
        }
    }
});

client.on('error', error => {
    logger.error(error);
});

client.on('warn', warning => {
    logger.warn(warning);
});

async function registerCommands(): Promise<void> {
    if (client.user === null) {
        logger.error('Could not register commands. Client user is null!');
        return;
    }

    // Push command to Discord application
    const rest = new REST({ version: '9' }).setToken(token);

    // // register guild specific commands
    // const guildId = '246328943299264513';
    // await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commandJSONs })
    //     .then(() => logger.info(strings.successfullyRegisteredCommands))
    //     .catch(logger.error);

    // register global commands
    await rest.put(Routes.applicationCommands(client.user.id), { body: commandJSONs })
        .then(() => logger.info(strings.successfullyRegisteredCommands))
        .catch(logger.error);
}