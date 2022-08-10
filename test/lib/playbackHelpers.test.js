import { interaction, pbItem, player, youtubeCache } from '../discord-js.mocks.js';

import * as playbackHelpers from '../../src/lib/playbackHelpers.js';
import { AudioPlayerStatus } from '@discordjs/voice';
import { EmbedBuilder } from 'discord.js';

describe('lib', function () {
    describe('playbackHelpers', function () {


        beforeEach(() => {
            jest.clearAllMocks();

            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            pbItem.isAgeRestricted = false;
            player.loop = false;
            player.playRes = undefined;
        });

        describe('playItem', function () {
            let searchQuery = 'Never gonna give you up';

            it('normal', async function() {
                player.dispatcher.state.status = AudioPlayerStatus.Paused;
                let res = await playbackHelpers.playItem(interaction, player, pbItem, youtubeCache, false, searchQuery, false);
                expect(res).toBeFalsy();
            });

            it('already playing', async function() {
                let res = await playbackHelpers.playItem(interaction, player, pbItem, youtubeCache, false, searchQuery, false);
                expect(res).toBeTruthy();
            });

            it('age restricted', async function() {
                pbItem.isAgeRestricted = true;
                let res = await playbackHelpers.playItem(interaction, player, pbItem, youtubeCache, false, searchQuery, false);
                expect(res).toBe(-1);
            });

            it('stream fail', async function() {
                player.dispatcher.state.status = AudioPlayerStatus.Paused;
                player.playRes = 1;
                let res = await playbackHelpers.playItem(interaction, player, pbItem, youtubeCache, false, searchQuery, false);
                expect(res).toBe(-1);
            });
        });

        describe('createPlayEmbed', function () {
            it('normal', async function() {
                player.loop = true;
                let res = await playbackHelpers.createPlayEmbed(pbItem, pbItem.requesterIconURL, true, player);
                expect(res).toBeInstanceOf(EmbedBuilder);
            });
        });
    });
});