'use strict';

const { expect } = require('chai');

const DEFAULT_TIMEOUT_MS = 4e3;
const { Fixture } = require('../lib/fixture');


describe('POST /clash/[cid]/award/[pid]', function() {
  const DEFAULT_PATH   = (cid, pid) => `/clash/${cid}/award/${pid}`;
  const DEFAULT_METHOD = 'POST';

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());

  context('active clash, active player, valid points', function () {
    it('response code is 200', async function () {
      const { cid, pid1 } = await fix._add_clash();
      const award_points = 1;
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), { points: award_points }, 200);
    });

    it('responds with correct clash', async function () {
      const { cid, pid1 } = await fix._add_clash();
      const award_points = 1;
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), { points: award_points }, 200, { cid });
    });

    it('response is clash model', async function () {
      const { cid, pid1 } = await fix._add_clash();
      const award_points = 1;
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), { points: award_points }, 200);
      
      const d = JSON.parse(body);
      expect(d).to.be.a.model('clash');
    });

    it('increment from zero points', async function () {
      const { cid, pid1 } = await fix._add_clash();
      const award_points = 1;
      await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), { points: award_points }, 200, { p1_points: award_points });
    });

    it('award points > 1', async function () {
      const { cid, pid1 } = await fix._add_clash();
      const award_points = 2;
      await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), { points: award_points }, 200, { p1_points: award_points });
    });

    it('increment from non-zero points', async function () {
      const { cid, pid1 } = await fix._add_clash();

      const initial_points = 1;
      await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), { points: initial_points }, 200);
      
      const award_points = 1;
      await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), { points: award_points }, 200, { p1_points: initial_points + award_points });
    });

    it('sequential calls', async function () {
      // repeat times
      // uses 1, 2, 3, ...
      const length = 4;

      const { cid, pid1 } = await fix._add_clash();

      let total_points = 0;
      for (const n of new Array(length).keys()) {
        const award_points = n+1;
        total_points += award_points;
        await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), { points: award_points }, 200, { p1_points: total_points });
      }
    });

    it('increment player2 points', async function () {
      const { cid, pid2 } = await fix._add_clash();
      const award_points = 1;
      await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid, pid2), { points: award_points }, 200, { p2_points: award_points });
    });

    it('increment both points', async function () {
      const { cid, pid1, pid2 } = await fix._add_clash();
      const award_points = 1;
      await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), { points: award_points }, 200, { p1_points: award_points, p2_points: 0 });
      await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid, pid2), { points: award_points }, 200, { p1_points: award_points, p2_points: award_points });
    });
  });


  context('invalid points', function () {
    it('points must be (strictly) positive', async function () {
      const test_vals = ['-1', '0'];

      const { cid, pid1 } = await fix._add_clash();
      return Promise.map(test_vals, async points => {
        await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), { points }, 400);
      });
    });

    it('empty points', async function () {
      const points = '';
      const { cid, pid1 } = await fix._add_clash();
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), { points }, 400);
    });

    it('points must be an integer', async function () {
      const points = '1.0';
      const { cid, pid1 } = await fix._add_clash();
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), { points }, 400);
    });

    it('invalid points', async function () {
      const points = 'one';
      const { cid, pid1 } = await fix._add_clash();
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), { points }, 400);
    });
  });


  context('invalid player', function () {
    it('player does not exist', async function () {
      const points = '1';
      const pid = '999';
      const { cid } = await fix._add_clash();      
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid, pid), { points }, 404);
    });

    it('player is not in clash', async function () {
      const points = '1';
      const [{ cid }, pid] = await Promise.all([
        fix._add_clash(),
        fix._add_player()
      ]);
      
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid, pid), { points }, 400);
    });
  });


  context('invalid clash', function () {
    it('clash does not exist', async function () {
      const points = '1';
      const cid = '999';
      const { pid1 } = await fix._add_clash();
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), { points }, 404);
    });

    it('clash is not active', async function () {
      const points = 1;
      const { cid, pid1 } = await fix._add_clash();
      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), { points }, 409);
    });
  });
});


describe('POST /clash/[cid]/end', function() {
  const DEFAULT_PATH   = (cid) => `/clash/${cid}/end`;
  const DEFAULT_METHOD = 'POST';

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());


  context('active clash, active player', function () {
    it('response code is 200', async function () {
      const { cid, pid1 } = await fix._add_clash();
      await fix._award_points(cid, pid1);
      await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, { cid });
    });

    it('responds with correct clash', async function () {
      const { cid, pid1 } = await fix._add_clash();
      await fix._award_points(cid, pid1);
      await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, { cid });
    });

    it('response is clash model', async function () {
      const { cid, pid1 } = await fix._add_clash();
      await fix._award_points(cid, pid1);   
      const {body} = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, { cid });
      const d = JSON.parse(body);
      expect(d).to.be.a.model('clash');
    });

    it('sets end_at', async function () {
      const { cid, pid1 } = await fix._add_clash();
      await fix._award_points(cid, pid1);   
      
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, { cid });      
      const d = JSON.parse(body);

      expect(d).to.have.property('ends_at');
      expect(d['ends_at']).to.be.iso8601;
    });

    it('award prize to win player', async function () {
      const initial_balance_usd = '10.00';
      const entry_fee_usd = '2.50';
      const prize_usd = '4.00'

      const [pid1,pid2] = await Promise.all([
        fix._add_player({initial_balance_usd}),
        fix._add_player({initial_balance_usd})
      ]);

      const { cid } = await fix._add_clash({pid1, pid2, entry_fee_usd, prize_usd});
      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);

      const exp_balance_usd = fix._add_usd(fix._sub_usd(initial_balance_usd, entry_fee_usd), prize_usd);

      const { balance_usd } = await fix._get_player(pid1);
      expect(balance_usd).to.be.equal(exp_balance_usd);
    });

    it('no prize to lose player', async function () {
      const initial_balance_usd = '10.00';
      const entry_fee_usd = '2.50';
      const prize_usd = '4.00';

      const [pid1,pid2] = await Promise.all([
        fix._add_player({initial_balance_usd}),
        fix._add_player({initial_balance_usd})
      ]);

      const { cid } = await fix._add_clash({pid1, pid2, entry_fee_usd, prize_usd});
      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);

      const exp_balance_usd = fix._sub_usd(initial_balance_usd, entry_fee_usd);

      const { balance_usd } = await fix._get_player(pid2);
      expect(balance_usd).to.be.equal(exp_balance_usd);
    });
  });


  context('not active clash', function () {
    it('clash is not active', async function() {
      const { cid, pid1 } = await fix._add_clash();
      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);

      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 409);
    });


    it('clash does not exist', async function() {
      const cid = '999';
      await fix._add_clash();
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 404);
    });


    it('cannot end tied (at zero) clash', async function() {
      const { cid } = await fix._add_clash();
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 409);
    });


    it('cannot end tied (at non-zero) clash', async function() {
      const points = 4;

      const { cid, pid1, pid2 } = await fix._add_clash();
      await fix._award_points(cid, pid1, points);
      await fix._award_points(cid, pid2, points);
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 409);
    });
  });
});


describe('POST /clash/[cid]/disqualify/[pid]', function() {
  const DEFAULT_PATH   = (cid, pid) => `/clash/${cid}/disqualify/${pid}`;
  const DEFAULT_METHOD = 'POST';

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());


  context('active clash, active player', function () {
    it('response code is 200', async function () {
      const { cid, pid1 } = await fix._add_clash();
      await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), {}, 200, { cid });
    });

    it('responds with correct clash', async function () {
      const { cid, pid1 } = await fix._add_clash();
      await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), {}, 200, { cid });
    });

    it('response is clash model', async function () {
      const { cid, pid1 } = await fix._add_clash();
      const {body} = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), {}, 200, { cid });
      const d = JSON.parse(body);
      expect(d).to.be.a.model('clash');
    });

    it('sets end_at', async function () {
      const { cid, pid1 } = await fix._add_clash();      
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), {}, 200, { cid });      
      const d = JSON.parse(body);

      expect(d).to.have.property('ends_at');
      expect(d['ends_at']).to.be.iso8601;
    });

    it('award prize to win player', async function () {
      const initial_balance_usd = '10.00';
      const entry_fee_usd = '2.50';
      const prize_usd = '4.00'

      const [pid1,pid2] = await Promise.all([
        fix._add_player({initial_balance_usd}),
        fix._add_player({initial_balance_usd})
      ]);

      const { cid } = await fix._add_clash({pid1, pid2, entry_fee_usd, prize_usd});
      await fix._disqualify(cid, pid1);

      const exp_balance_usd = fix._add_usd(fix._sub_usd(initial_balance_usd, entry_fee_usd), prize_usd);

      const { balance_usd } = await fix._get_player(pid2);
      expect(balance_usd).to.be.equal(exp_balance_usd);
    });

    it('no prize to lose player', async function () {
      const initial_balance_usd = '10.00';
      const entry_fee_usd = '2.50';
      const prize_usd = '4.00';

      const [pid1,pid2] = await Promise.all([
        fix._add_player({initial_balance_usd}),
        fix._add_player({initial_balance_usd})
      ]);

      const { cid } = await fix._add_clash({pid1, pid2, entry_fee_usd, prize_usd});
      await fix._disqualify(cid, pid1);

      const exp_balance_usd = fix._sub_usd(initial_balance_usd, entry_fee_usd);

      const { balance_usd } = await fix._get_player(pid1);
      expect(balance_usd).to.be.equal(exp_balance_usd);
    });
  });


  context('not active clash', function () {
    it('clash is not active', async function() {
      const { cid, pid1 } = await fix._add_clash();
      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);

      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), {}, 409);
    });


    it('clash does not exist', async function() {
      const cid = '999';
      const { pid1 } = await fix._add_clash();
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid, pid1), {}, 404);
    });
  });


  context('invalid player', function () {
    it('player does not exist', async function () {
      const pid = '999';
      const { cid } = await fix._add_clash();      
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid, pid), {}, 404);
    });

    it('player is not in clash', async function () {
      const [{ cid }, pid] = await Promise.all([
        fix._add_clash(),
        fix._add_player()
      ]);
      
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(cid, pid), {}, 400);
    });
  });
});
