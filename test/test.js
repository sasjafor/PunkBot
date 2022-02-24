// import chai from 'chai';
// import chaiAsPromised from 'chai-as-promised';
// import sinon from 'sinon';

// chai.config.includeStack = true;
// chai.use(chaiAsPromised);

// sinon.assert.expose(chai.assert, { prefix: '' });

// const assert = chai.assert;
// const expect = chai.expect;

import { strings } from '../src/lib/strings.js';

import * as clear from '../src/commands/clear.js';

describe('commands', function () {
    describe('clear', function () {
        const interaction = {
            guild: {
                id: 1234,
            },
            reply: jest.fn(),
        };

        const player = {
            conn: 'Legit Connection',
            clear: jest.fn(),
        };

        const players = {
            1234: player,
        };

        // it('returns successfully', function () {
        //     // return assert.isFulfilled(clear.execute(interaction, players));
            
        // });

        it('calls clear once', function() {
            // assert(player.clear.calledOnce);
            clear.execute(interaction, players);
            expect(player.clear).toHaveBeenCalledTimes(1);
        });

        // it('replies with strings.cleared', function () {
        //     assert(interaction.reply.calledWith({ content: strings.cleared }));
        // });

        it('replies not connected if conn is undefined or null', function() {
            player.conn = null;
            clear.execute(interaction, players);
            expect(interaction.reply).toHaveBeenCalledWith({ content: strings.notConnected, ephemeral: true });
        });
    });
});