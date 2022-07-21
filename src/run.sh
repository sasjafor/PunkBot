#!/bin/sh
rm -rf /config/node_modules
rm -rf /config/lib
rm -rf /config/commands
cp -r /usr/src/app/* /config/
cd /config

while true; do
    LOG_COLOR=${LOG_COLOR:-'false'} DEBUG=${DEBUG:-'info'} YOUTUBE_DL_DIR=/usr/local/bin/youtube-dl DISCORD_APP_AUTH_TOKEN=${DISCORD_APP_AUTH_TOKEN} YOUTUBE_API_KEY=${YOUTUBE_API_KEY} node ./bot.js
done
