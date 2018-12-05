#!/bin/bash
rm -rf /config/node_modules
cp -r /usr/src/app/* /config/
while true; do
AUTH_TOKEN=${DISCORD_APP_AUTH_TOKEN} YOUTUBE_API_KEY=${YOUTUBE_API_KEY} node /config/bot.js
done
