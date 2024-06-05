import { interaction, player, players, resetMockObjects } from 'discord-js.mocks';

import * as summon from 'commands/summon';

describe('commands', function () {
    describe('summon', function () {
        beforeEach(() => {
            jest.clearAllMocks();
            resetMockObjects();
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