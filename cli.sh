#!/usr/bin/env bash
for i in "$@"
do
case $i in
    --token=*)
    DISCORD_APP_AUTH_TOKEN="${i#*=}"
    shift
    ;;
    --key=*)
    YOUTUBE_API_KEY="${i#*=}"
    shift
    ;;
    --default)
    DEFAULT=YES
    shift
    ;;
    *)
    ;;
esac
done
if [ -z "$DISCORD_APP_AUTH_TOKEN" ]
then
    echo "Please supply a Discord app auth token with --token= or set DISCORD_APP_AUTH_TOKEN"
    exit 0
fi
if [ -z "$YOUTUBE_API_KEY" ]
then
    echo "Please supply a Youtube api key with --key= or set YOUTUBE_API_KEY"
    exit 0
fi
while true; do
    node ./src/bot.js
done
