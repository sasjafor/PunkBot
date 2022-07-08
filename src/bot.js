import fs from 'fs';

import { Client, Collection, GuildMember, Intents, TextChannel } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { URL } from 'url';

import { errorReply } from './lib/util.js';
import { LimitedDict } from './lib/limitedDict.js';
import { logger } from './lib/log.js';
import { Player } from './lib/player.js';
import { strings } from './lib/strings.js';

const token = process.env.DISCORD_APP_AUTH_TOKEN;
const youtubeAPIKey = process.env.YOUTUBE_API_KEY;
const client = new Client({ intents: [Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });
const hasYoutubeCookies = fs.existsSync('./.data/youtube.data');

const players = {};
const youtubeCache = new LimitedDict(100);
const commands = new Collection();
const commandFilesPath = new URL('./commands', import.meta.url).pathname;
const commandFiles = fs.readdirSync(commandFilesPath).filter(file => file.endsWith('.js'));

const commandJSONs = [];

async function importCommands() {
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

async function login() {
    try {
        await client.login(token);
    } catch(error) {
        logger.error(error);
    }
}
login();

client.on('ready', async () => {
    logger.info('Connected as ' + client.user.username);

    // Push command to Discord application
    const rest = new REST({ version: '9' }).setToken(token);

    // await rest.put(Routes.applicationGuildCommands(client.user.id, '374283832901500928'), { body: commandJSONs })
    //     .then(() => logger.info('Successfully registered application commands.'))
    //     .catch(logger.error);

    await rest.put(Routes.applicationCommands(client.user.id), { body: commandJSONs })
        .then(() => logger.info('Successfully registered application commands.'))
        .catch(logger.error);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) {
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

    let guildId = interaction.guildId;
    let player = players[guildId];
    if (!player) {
        player = players[guildId] = new Player();
    }

    try {
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
        if (!(message.channel instanceof TextChannel) || !message.channel.permissionsFor(message.guild.me).has('SEND_MESSAGES')) {
            return;
        }

        message.channel.send({ content: strings.switchToSlashCommands });
    }
});

client.on('error', error => {
    logger.error(error);
});

client.on('warn', warning => {
    logger.warn(warning);
});
