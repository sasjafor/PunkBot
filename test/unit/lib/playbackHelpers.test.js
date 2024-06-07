import { interaction, pbItem, player, resetMockObjects, youtubeCache } from 'discord-js.mocks';

import * as playbackHelpers from 'lib/playbackHelpers';

import { AudioPlayerStatus } from '@discordjs/voice';
import { EmbedBuilder } from 'discord.js';

describe('lib', function () {
    describe('playbackHelpers', function () {
        beforeEach(() => {
            jest.clearAllMocks();

            resetMockObjects();

            player.dispatcher.state.status = AudioPlayerStatus.Playing;
            pbItem.isAgeRestricted = false;
        });

        describe('playItem', function () {
            let searchQuery = 'Never gonna give you up';

            it('normal', async function() {
                player.dispatcher.state.status = AudioPlayerStatus.Paused;
                let res = await playbackHelpers.playItem(interaction, player, pbItem, youtubeCache, false, searchQuery, false);
                expect(res).toBe(0);
            });

            it('already playing', async function() {
                player.isIdleRetVal = true;
                let res = await playbackHelpers.playItem(interaction, player, pbItem, youtubeCache, false, searchQuery, false);
                expect(res).toBeTruthy();
            });

            it('age restricted', async function() {
                pbItem.isAgeRestricted = true;
                let res = await playbackHelpers.playItem(interaction, player, pbItem, youtubeCache, false, searchQuery, false);
                expect(res).toBe(-1);
            });

            // it('stream fail', async function() {
            //     player.dispatcher.state.status = AudioPlayerStatus.Paused;
            //     player.playRes = 1;
            //     let res = await playbackHelpers.playItem(interaction, player, pbItem, youtubeCache, false, searchQuery, false);
            //     expect(res).toBe(-1);
            // });
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