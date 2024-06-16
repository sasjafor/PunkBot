#!/bin/sh

cp -r /config/.data /app/

while true; do
    LOG_COLOR=${LOG_COLOR:-'false'} DEBUG=${DEBUG:-'info'} YOUTUBE_DL_DIR=/usr/local/bin/youtube-dl DISCORD_APP_AUTH_TOKEN=${DISCORD_APP_AUTH_TOKEN} YOUTUBE_API_KEY=${YOUTUBE_API_KEY} node -r source-map-support/register build/bot.js
done
