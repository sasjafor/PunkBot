const fs = require('fs');
const path = require('path');
const { Client, Collection, GuildMember, Intents, TextChannel, DiscordAPIError } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const Debug = require('debug');
const debug = Debug('punk_bot');
// eslint-disable-next-line no-unused-vars
const debugv = Debug('punk_bot:verbose');
// eslint-disable-next-line no-unused-vars
const debugd = Debug('punk_bot:debug');

const { LimitedDict } = require('./lib/limited-dict.js');
const { Player } = require('./lib/player.js');
const { strings } = require('./lib/strings.js');

const token = process.env.DISCORD_APP_AUTH_TOKEN;
const youtubeAPIKey = process.env.YOUTUBE_API_KEY;
const client = new Client({ intents: [Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });

const players = {};
const youtubeCache = new LimitedDict(100);
const commands = new Collection();
const commandFiles = fs.readdirSync(path.resolve(__dirname, './commands')).filter(file => file.endsWith('.js'));

const commandJSONs = [];

module.exports = {
    players,
    youtubeAPIKey,
    youtubeCache,
};

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    commands.set(command.data.name, command);
    // Add command JSON to list
    commandJSONs.push(command.data.toJSON());
}

function login() {
    try {
        client.login(token);
    } catch (err) {
        debug(err);
        login();
    }
}
login();

client.on('ready', async () => {
    debug('I am ready!');
    console.log('Connected as ' + client.user.username);

    // Push command to Discord application
    const rest = new REST({ version: '9' }).setToken(token);

    // await rest.put(Routes.applicationGuildCommands(client.user.id, '246328943299264513'), { body: commandJSONs })
    //     .then(() => console.log('Successfully registered application commands.'))
    //     .catch(console.error);

    await rest.put(Routes.applicationCommands(client.user.id), { body: commandJSONs })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);
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
        console.log('Member was not of GuildMember type');
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
        await command.execute(interaction);
    } catch (error) {
        debug(error);
        if (interaction.replied) {
            await interaction.editReply({ content: 'There was an error while executing this command!', embeds: [] });
        } else {
            try {
                await interaction.reply({ content: 'There was an error while executing this command!', embeds: [], ephemeral: true });
            } catch (err) {
                if (err instanceof DiscordAPIError && err.message.includes('Interaction has already been acknowledged.')) {
                    await interaction.editReply({ content: 'There was an error while executing this command!', embeds: [] });
                } else {
                    debug(err);
                }
            }
        }
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
    debug(error);
});

client.on('warn', warning => {
    debug(warning);
});
