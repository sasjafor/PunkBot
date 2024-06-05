import { interaction, player, players, resetMockObjects } from 'discord-js.mocks';

import * as volume from 'commands/volume';

describe('commands', function () {
    describe('volume', function () {
        beforeEach(() => {
            jest.clearAllMocks();
            resetMockObjects();
        });

        it('normal', async function() {
            await volume.execute(interaction, players);
            expect(player.setVolume).toHaveBeenCalledWith(interaction.volumeVal);
            expect(player.setVolume).toHaveBeenCalledTimes(1);
        });
    });
});