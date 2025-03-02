import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { LimitedDict } from './lib/limitedDict.js';
import { PlaybackItem } from './lib/playbackItem.js';
import { Player } from './lib/player.js';

type PlayerDict = { [key: string]: Player };
type ExecuteFunction = (_interaction: CommandInteraction, _players: PlayerDict, _youtubeAPIKey: string, _youtubeCache: LimitedDict<PlaybackItem>, _hasYoutubeCookies: boolean) => Promise<void>;
type SlashCommand = { data: SlashCommandBuilder, execute: ExecuteFunction };

type YoutubeAPIGenericOptions = {
    key: string,
    part: string,
    maxResults?: number,
    pageToken?: string,
};
type YoutubeAPIOptions = YoutubeAPIGenericOptions & {
    id: string,
};
type YoutubeAPIPlaylistItemsOptions = YoutubeAPIGenericOptions & {
    id?: string,
    playlistId: string,
}
type YoutubeAPISearchOptions = YoutubeAPIGenericOptions & {
    q: string,
    type?: string,
};

type YoutubeAPIContentRating = {
    ytRating: string,
};
type YoutubeAPIPageInfo = {
    totalResults: number,
    resultsPerPage: number
};
type YoutubeAPILocalized = {
    title: string,
    description: string
};
type YoutubeAPIThumbnail = {
    url: string,
    width: number,
    height: number
};
type YoutubeAPIThumbnails = {
    default: YoutubeAPIThumbnail,
    medium: YoutubeAPIThumbnail,
    high: YoutubeAPIThumbnail,
    standard: YoutubeAPIThumbnail,
    maxres: YoutubeAPIThumbnail
};
type YoutubeAPIResourceID = {
    kind: string,
    videoId: string,
    channelId: string,
    playlistId: string
};

type YoutubeAPIVideoSnippet = {
    publishedAt: string,
    channelId: string,
    title: string,
    description: string,
    thumbnails: YoutubeAPIThumbnails,
    channelTitle: string,
    tags: [string],
    categoryId: string,
    liveBroadcastContent: string,
    defaultLanguage: string,
    localized: YoutubeAPILocalized,
    defaultAudioLanguage: string
};
type YoutubeAPIVideoContentDetails = {
    duration: string,
    dimension: string,
    definition: string,
    caption: string,
    licensedContent: boolean,
    contentRating: YoutubeAPIContentRating,
    projection: string
};
type YoutubeAPIVideoItem = {
    kind: string,
    etag: string,
    id: string,
    snippet: YoutubeAPIVideoSnippet,
    contentDetails: YoutubeAPIVideoContentDetails
};
type YoutubeAPIVideoInfo = {
    kind: string,
    etag: string,
    items: YoutubeAPIVideoItem[],
    pageInfo: YoutubeAPIPageInfo
};

type YoutubeAPIPlaylistSnippet = {
    publishedAt: string,
    channelId: string,
    title: string,
    description: string,
    thumbnails: YoutubeAPIThumbnails,
    channelTitle: string,
    localized: YoutubeAPILocalized
};
type YoutubeAPIPlaylistContentDetails = {
    itemCount: number
};
type YoutubeAPIPlaylistInfoItem = {
    kind: string,
    etag: string,
    id: string,
    snippet: YoutubeAPIPlaylistSnippet,
    contentDetails: YoutubeAPIPlaylistContentDetails
};
type YoutubeAPIPlaylistInfo = {
    kind: string,
    etag: string,
    nextPageToken: string,
    items: YoutubeAPIPlaylistInfoItem[],
    pageInfo: YoutubeAPIPageInfo
};

type YoutubeAPIPlaylistItemSnippet = {
    publishedAt: string,
    channelId: string,
    title: string,
    description: string,
    thumbnails: YoutubeAPIThumbnails,
    channelTitle: string,
    playlistId: string,
    position: number,
    resourceId: YoutubeAPIResourceID,
    videoOwnerChannelTitle: string,
    videoOwnerChannelId: string,
};
type YoutubeAPIPlaylistItemContentDetails = {
    videoId: string,
    videoPublishedAt: string
};
type YoutubeAPIPlaylistItem = {
    kind: string,
    etag: string,
    id: string,
    snippet: YoutubeAPIPlaylistItemSnippet,
    contentDetails: YoutubeAPIPlaylistItemContentDetails
};
type YoutubeAPIPlaylistItemsInfo = {
    kind: string,
    etag: string,
    nextPageToken: string,
    items: YoutubeAPIPlaylistItem[],
    pageInfo: YoutubeAPIPageInfo
};

type YoutubeAPISearchSnippet = {
    publishedAt: string,
    channelId: string,
    title: string,
    description: string,
    thumbnails: YoutubeAPIThumbnails,
    channelTitle: string,
    liveBroadcastContent: string,
    publishTime: string
};
type YoutubeAPISearchItem = {
    kind: string,
    etag: string,
    id: YoutubeAPIResourceID,
    snippet: YoutubeAPISearchSnippet
};
type YoutubeAPISearchInfo = {
    kind: string,
    etag: string,
    nextPageToken: string,
    prevPageToken: string,
    regionCode: string,
    items: YoutubeAPISearchItem[],
    pageInfo: YoutubeAPIPageInfo
};

//#region Results

type YoutubePageInfo = {
    totalResults: number,
    resultsPerPage: number,
    nextPageToken?: string
};

type YoutubeVideoInfoResult = {
    kind: string,
    publishedAt: string,
    channelId: string,
    channelTitle: string,
    title: string,
    description: string,
    duration: string,
    contentRating: YoutubeAPIContentRating,
    thumbnails: YoutubeAPIThumbnails
};
type YoutubeVideoInfoData = {
    results: YoutubeVideoInfoResult[],
    pageInfo: YoutubePageInfo
};
type YoutubePlaylistInfoResult = {
    kind: string,
    publishedAt: string,
    channelId: string,
    channelTitle: string,
    title: string,
    description: string,
    thumbnails: YoutubeAPIThumbnails,
    itemCount: number
};
type YoutubePlaylistInfoData = {
    results: YoutubePlaylistInfoResult[],
    pageInfo: YoutubePageInfo
};
type YoutubePlaylistItemsResult = {
    kind: string,
    videoId: string,
    title: string,
};
type YoutubePlaylistItemsData = {
    results: YoutubePlaylistItemsResult[],
    pageInfo: YoutubePageInfo
};
type YoutubeSearchResult = {
    id: string,
    link: string,
    kind: string,
    publishedAt: string,
    channelId: string,
    channelTitle: string,
    title: string,
    description: string,
    thumbnails: YoutubeAPIThumbnails,
}
type YoutubeSearchData = {
    results: YoutubeSearchResult[],
    pageInfo: YoutubePageInfo
}

type BasicVideoInfo = {
    id: string,
    url: string,
    title: string,
}

//#endregion

export {
    ExecuteFunction,
    BasicVideoInfo,
    PlayerDict,
    SlashCommand,
    YoutubeVideoInfoData,
    YoutubeAPIOptions,
    YoutubeAPIPlaylistInfo,
    YoutubeAPIPlaylistItemsInfo,
    YoutubeAPISearchInfo,
    YoutubeAPISearchOptions,
    YoutubeAPIPlaylistItemsOptions,
    YoutubeAPIVideoInfo,
    YoutubePlaylistInfoData,
    YoutubePlaylistItemsData,
    YoutubeSearchData,
};
