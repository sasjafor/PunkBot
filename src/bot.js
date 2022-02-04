const fs = require('fs');
const path = require('path');
const { Client, Collection, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Player } = require('./lib/player.js');
const { strings } = require('./lib/strings.js');
const Debug = require('debug');
const debug = Debug('punk_bot');
const debugv = Debug('punk_bot:verbose');
const debugd = Debug('punk_bot:debug');

const token = process.env.DISCORD_APP_AUTH_TOKEN;
const youtubeAPIKey = process.env.YOUTUBE_API_KEY;
const client = new Client({ intents: [Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });

const bot_in_voice_only_commands = ['skip', 'loop', 'clear', 'remove', 'seek', 'disconnect', 'volume', 'vol', 'np', 'now_playing', 'shuffle', 'queue'];
const voice_only_commands = ['p', 'play', 'seek', 'summon', 'join', ...bot_in_voice_only_commands];

const players = {};
const commands = new Collection();
const commandFiles = fs.readdirSync(path.resolve(__dirname, './commands')).filter(file => file.endsWith('.js'));

const commandJSONs = [];

module.exports = {
    players,
    youtubeAPIKey,
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
    // const customytdlBinaryPath = path.resolve('/usr/local/bin/youtube-dl')
    // youtubedl.setYtdlBinary(customytdlBinaryPath)
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

    if (!interaction.member || !interaction.member.voice.channel) {
        await interaction.reply({ content: strings.needToBeInVoice });
        return;
    }

    let guildId = interaction.guildId;
    let player = players[guildId];
    if (!player) {
        player = players[guildId] = new Player(interaction.member.voice.channel.id);
    }

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) {
        return;
    }

    if (message.content[0] == '!') {
        var regex_content = /^![a-zA-Z]* (.*)/;
        var content = null;
        var command = message.content.match(/^!([a-zA-Z]*)/)[1];
        if (!message.channel.permissionsFor(message.guild.me)
            .has('SEND_MESSAGES')) {
            return;
        }
        if (!message.member.voice.channel) {
            if (voice_only_commands.includes(command)) {
                message.channel.send(strings.needToBeInVoice);
            }
            return;
        }
        if (regex_content.test(message.content)) {
            content = message.content.match(regex_content)[1];
        }

        debugv('Command: ' + message.content);
        switch (command) {
            // case 'p':
            // case 'play':
                
            // case 'summon':
            // case 'join':

            default:
                // if (!player.conn && bot_in_voice_only_commands.includes(command)) {
                //     message.channel.send(strings.notConnected);
                //     return;
                // }
                switch (command) {
                    // case 'skip':

                    // case 'clear':

                    // case 'remove':

                    // case 'loop':

                    // case 'disconnect':

                    // case 'vol':
                    // case 'volume':

                    // case 'dbg':
                    // case 'debug':
                    //     {
                    //         debugd(player.conn);
                    //         debugd(player.stream);
                    //         break;
                    //     }

                    // case 'np':
                    // case 'now_playing':

                    // case 'queue':

                    // case 'shuffle':

                    // case 'seek':

                    default:
                        message.channel.send(strings.invalidCommand);
                }
        }
    }
});

client.on('error', error => {
    debug(error);
});

client.on('warn', warning => {
    debug(warning);
});
