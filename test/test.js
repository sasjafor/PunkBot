import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

chai.config.includeStack = true;
chai.use(chaiAsPromised);

const assert = chai.assert;
const expect = chai.expect;

import { strings } from '../src/lib/strings.js';

import * as clear from '../src/commands/clear.js';

describe('commands', function () {
    describe('clear', function () {
        const interaction = {
            guild: {
                id: 1234,
            },
            reply: sinon.fake(),
        };

        const player = {
            conn: 'Legit Connection',
            clear: sinon.fake(),
        };

        const players = {
            1234: player,
        };

        it('returns successfully', function () {
            return assert.isFulfilled(clear.execute(interaction, players));
        });

        it('calls clear once', function () {
            assert(player.clear.calledOnce);
        });

        it('replies with strings.cleared', function () {
            assert(interaction.reply.calledWith({ content: strings.cleared }));
        });
    });
});