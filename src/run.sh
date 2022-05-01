#!/bin/bash
rm -rf /config/node_modules
rm -rf /config/lib
rm -rf /config/commands
cp -r /usr/src/app/* /config/
while true; do
LOG_COLOR=false DEBUG=info YOUTUBE_DL_DIR=/usr/local/bin/youtube-dl DISCORD_APP_AUTH_TOKEN=${DISCORD_APP_AUTH_TOKEN} YOUTUBE_API_KEY=${YOUTUBE_API_KEY} node /config/bot.js
done
