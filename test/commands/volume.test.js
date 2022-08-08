import { interaction, player, players } from '../discord-js.mocks.js';

import * as volume from '../../src/commands/volume.js';

describe('commands', function () {
    describe('volume', function () {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('normal', async function() {
            await volume.execute(interaction, players);
            expect(player.setVolume).toHaveBeenCalledWith(interaction.volumeVal);
            expect(player.setVolume).toHaveBeenCalledTimes(1);
        });
    });
});