import { interaction, player, players } from '../discord-js.mocks.js';

import * as summon from '../../src/commands/summon.js';

describe('commands', function () {
    describe('summon', function () {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('normal', async function() {
            await summon.execute(interaction, players);
            expect(player.connect).toHaveBeenCalledTimes(1);
        });

        it('not joinable', async function() {
            interaction.member.voice.channel.joinable = false;
            await summon.execute(interaction, players);
            expect(player.connect).toHaveBeenCalledTimes(0);
        });
    });
});