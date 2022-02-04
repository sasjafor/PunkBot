const fs = require('fs');
const path = require('path');
const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const moment = require('moment');
const youtubedl = require('youtube-dl-exec');
const { Player } = require('./lib/player.js');
const { prettifyTime } = require('./lib/util.js');
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
}

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
    console.log("Connected as " + client.user.username);

    // Push command to Discord application
    const rest = new REST({ version: '9' }).setToken(token);

    await rest.put(Routes.applicationGuildCommands(client.user.id, '374283832901500928'), { body: commandJSONs })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

	const command = commands.get(interaction.commandName);

	if (!command) return;

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
                message.channel.send(strings.need_to_be_in_voice);
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
                if (!player.conn && bot_in_voice_only_commands.includes(command)) {
                    message.channel.send(strings.not_connected);
                    return;
                }
                switch (command) {
                    // case 'skip':

                    // case 'clear':

                    case 'remove':
                        {
                            let num = parseInt(content);
                            if (num !== 0 && !num) {
                                let embed = new MessageEmbed()
                                    .setDescription(':x: **Invalid format**\n\n!remove [Entry]')
                                    .setColor('#ff0000');
                                message.channel.send({embeds: [embed]});
                                return;
                            }
                            let remove_res = player.remove(num);
                            if (remove_res) {
                                message.channel.send(strings.removed + '`' + remove_res.title + '`');
                            } else {
                                message.channel.send(strings.out_of_range);
                            }
                            break;
                        }
                    case 'loop':
                        {
                            player.loop = !player.loop;
                            if (player.loop) {
                                message.channel.send(strings.loop_enabled);
                            } else {
                                message.channel.send(strings.loop_disabled);
                            }
                            break;
                        }
                    case 'disconnect':
                        {
                            player.disconnect();
                            message.channel.send(strings.disconnected);
                            break;
                        }
                    case 'vol':
                    case 'volume':
                        {
                            let vol_regex = /(0\.)?[0-9]+/;
                            if (!vol_regex.test(content)) {
                                message.channel.send(strings.invalid_vol_format);
                                return;
                            }
                            let value = content;
                            player.setVolume(value);
                            message.channel.send(strings.volume_set + '`' + value + '`');
                            break;
                        }
                    case 'dbg':
                    case 'debug':
                        {
                            debugd(player.conn);
                            debugd(player.stream);
                            break;
                        }
                    case 'np':
                    case 'now_playing':
                        {
                            let np = player.getNowPlaying();
                            let progress = player.getProgress();
                            if (np && progress) {
                                let progress_bar = buildProgressBar(progress, np.duration);
                                let progress_string = prettifyTime(progress) + ' / ' + prettifyTime(np.duration);
                                let embed = new MessageEmbed()
                                    .setTitle(np.title)
                                    .setAuthor('Now Playing ♪', client.user.avatarURL(), 'https://github.com/sasjafor/PunkBot')
                                    .setURL(np.url)
                                    .setThumbnail(np.thumbnailURL)
                                    .setColor('#0056bf')
                                    .setDescription('\u200B\n`' + progress_bar + '`\n\n`' + progress_string + '`\n\n`Requested by:` ' + np.requesterName);
                                message.channel.send({embeds: [embed]});
                            } else {
                                message.channel.send(strings.nothing_playing);
                            }
                            break;
                        }
                    // case 'queue':

                    case 'shuffle':
                        {
                            player.shuffle();
                            message.channel.send(strings.shuffled);
                            debug('Shuffled queue');
                            break;
                        }
                    case 'seek':
                        {
                            let seek_time_regex = /(([0-9]+:)?([0-9]+:)?)?[0-9]+$/;
                            if (!seek_time_regex.test(content) || (content.match(seek_time_regex))
                                .index != 0) {
                                message.channel.send(strings.invalid_seek_format);
                                return;
                            }
                            let min_hour_regex = /([0-9]+)(?::)/g;
                            let time1 = min_hour_regex.exec(content);
                            let time2 = min_hour_regex.exec(content);
                            let seconds = parseInt(content.match(/[0-9]+$/)[0], 10);
                            let minutes = 0;
                            let hours = 0;
                            if (time1) {
                                if (time2) {
                                    minutes = parseInt(time2[1], 10);
                                    hours = parseInt(time1[1], 10);
                                } else {
                                    minutes = parseInt(time1[1], 10);
                                }
                            }
                            let seek_time = 3600 * hours + 60 * minutes + seconds;
                            let duration = moment.duration(seek_time * 1000);
                            let res_code = player.seek(seek_time);
                            switch (res_code) {
                                case 0:
                                    var pretty_time = prettifyTime(duration);
                                    message.channel.send(':musical_note: **Set position to**' + '`' + pretty_time + '`' + ':fast_forward:');
                                    break;
                                case 1:
                                    message.channel.send(strings.seek_too_long);
                                    break;
                                case 2:
                                    message.channel.send(strings.nothing_playing);
                                    break;
                            }
                            break;
                        }
                    default:
                        message.channel.send(strings.invalid_command);
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

function buildProgressBar(progress, total_time) {
    let pr = progress.asSeconds();
    let tt = total_time.asSeconds();

    if (pr > tt) {
        tt = pr;
    }

    let mul = 30 / tt;
    let pos = Math.round(pr * mul);
    let res = '';
    for (let i = 0; i < pos; i++) {
        res += '▬';
    }
    res += '🔘';
    let rest = 30 - pos;
    for (let i = 0; i < rest; i++) {
        res += '▬';
    }
    return res;
}
