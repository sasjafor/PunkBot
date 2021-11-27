# Punk Bot
[![npm link](https://nodei.co/npm/punk-bot.png?downloads=true&downloadRank=true)](https://www.npmjs.com/package/punk-bot)

[![Build Status](https://img.shields.io/travis/sasjafor/PunkBot?style=flat-square)](https://travis-ci.org/sasjafor/PunkBot) [![Total Downloads](https://img.shields.io/npm/dt/punk-bot.svg?style=flat-square)](https://www.npmjs.com/package/punk-bot) [![Latest Stable Version](https://img.shields.io/npm/v/punk-bot.svg?style=flat-square)](https://www.npmjs.com/package/punk-bot) [![Known Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/sasjafor/PunkBot?style=flat-square)](https://snyk.io/test/github/sasjafor/PunkBot) [![License](https://img.shields.io/badge/license-GPL-lightgrey.svg?style=flat-square)](https://opensource.org/licenses/gpl-license) [![Discord Server](https://img.shields.io/discord/518113399448666113.svg?style=flat-square&colorB=7289DA)](https://discord.gg/qPxJfWw) [![Discord Bot](https://img.shields.io/badge/discord-bot-blue.svg?style=flat-square&colorB=7289DA)](https://discordapp.com/api/oauth2/authorize?client_id=431490929677959178&permissions=120937536&scope=bot) 

A Discord music bot without limits.

## Usage
To use the bot you need to provide an authorisation token for a Discord application with the `DISCORD_APP_AUTH_TOKEN` environment variable. Additionally, a YouTube API key is needed, which is expected to be stored in `YOUTUBE_API_KEY`.

## Commands
* !p or !play [search string | url] - To search and play a youtube video or play any media that are supported by youtube-dl
* !loop - Enable loop
* !skip - Skip what is currently playing 
