# Punk Bot
[![npm link](https://nodei.co/npm/punk-bot.png?downloads=true&downloadRank=true)](https://www.npmjs.com/package/punk-bot)

[![Build Status](https://travis-ci.org/sasjafor/PunkBot.svg)](https://travis-ci.org/sasjafor/PunkBot) [![Total Downloads](https://img.shields.io/npm/dt/punk-bot.svg)](https://www.npmjs.com/package/punk-bot) [![Latest Stable Version](https://img.shields.io/npm/v/punk-bot.svg)](https://www.npmjs.com/package/punk-bot) [![Dependencies](https://david-dm.org/sasjafor/PunkBot/status.svg)](https://david-dm.org/sasjafor/PunkBot) [![License](https://img.shields.io/badge/license-GPL-lightgrey.svg)](https://opensource.org/licenses/gpl-license) [![Discord Server](https://discordapp.com/api/guilds/518113399448666113/embed.png)](https://discord.gg/qPxJfWw) [![Discord Bot](https://img.shields.io/badge/discord-bot-blue.svg)](https://discordapp.com/api/oauth2/authorize?client_id=431490929677959178&permissions=120937536&scope=bot)

A Discord music bot without limits.

## Usage
To use the bot you need to provide an authorisation token for a Discord application with the `DISCORD_APP_AUTH_TOKEN` environment variable. Additionally, a YouTube API key is needed, which is expected to be stored in `YOUTUBE_API_KEY`.

## Commands
* !p or !play [search string | url] - To search and play a youtube video or play any media that are supported by youtube-dl
* !loop - Enable loop
* !skip - Skip what is currently playing
