'use strict';

const { expect } = require('chai');

const DEFAULT_TIMEOUT_MS = 4e3;
const { Fixture } = require('../lib/fixture');


describe('POST /clash', function() {
  const DEFAULT_PATH   = '/clash';
  const DEFAULT_METHOD = 'POST';

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());


  context('active players', function () {
    it('response_code is 303 on success', async () => {
      const initial_balance_usd = '10.00';
      const [pid1, pid2] = await Promise.all([
        fix._add_player({initial_balance_usd}),
        fix._add_player({initial_balance_usd})
      ]);

      const ps = fix._add_clash_param({ pid1, pid2 });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303);
    });

    it('response_code 402 insufficient balance', async function () {
      const initial_balance_usd = '1.00';
      const entry_fee_usd = '2.00';
  
      const [pid1, pid2] = await Promise.all([
        fix._add_player({initial_balance_usd}),
        fix._add_player()
      ]);
      const ps = fix._add_clash_param({ pid1, pid2, entry_fee_usd });
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH, ps, 402);
    });

    it('players in clash', async function () {
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);
      const ps = fix._add_clash_param({ pid1, pid2 });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { p1_id: pid1, p2_id: pid2 });
    });

    it('entry reduces balance_usd', async function () {  
      const initial_balance_usd = '10.00';
      const entry_fee_usd = '1.50';

      const [pid1, pid2] = await Promise.all([
        fix._add_player({ initial_balance_usd }),
        fix._add_player({ initial_balance_usd })
      ]);
      const ps = fix._add_clash_param({ pid1, pid2, entry_fee_usd });
      await fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303);

      return Promise.map([pid1,pid2], async pid => {
        const { balance_usd } = await fix._get_player(pid);
        expect(balance_usd).to.equal(fix._sub_usd(initial_balance_usd, entry_fee_usd));
      });
    });

    it('response_code 404 if player does not exist', async function () {
      const pid2 = '999';
      const [pid1] = await Promise.all([
        fix._add_player()
      ]);
      const ps = fix._add_clash_param({ pid1, pid2 });
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH, ps, 404);
    });

    it('response_code 409 if player in active clash', async function () {
      const [pid1, pid2, pid3] = await Promise.all([
        fix._add_player(),
        fix._add_player(),
        fix._add_player()
      ]);
      const ps1 = fix._add_clash_param({ pid1, pid2 });
      await fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps1, 303);

      const ps2 = fix._add_clash_param({ pid1, pid2:pid3 });
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH, ps2, 409);
    });
  });


  context('prize_usd', function () {
    it('set if valid, two precision digit', async () => {
      const prize_usd = '10.13';
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);
      const ps = fix._add_clash_param({ pid1, pid2, prize_usd });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { prize_usd: fix._add_usd(prize_usd, 0) });
    });


    it('set if valid, one precision digit', async () => {
      const prize_usd = '10.1';
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);
      const ps = fix._add_clash_param({ pid1, pid2, prize_usd });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { prize_usd: fix._add_usd(prize_usd, 0) });
    });


    it('set if valid, zero precision digit with decimal', async () => {
      const prize_usd = '10.';
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);
      const ps = fix._add_clash_param({ pid1, pid2, prize_usd });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { prize_usd: fix._add_usd(prize_usd, 0) });
    });


    it('set if valid, zero precision digit', async () => {
      const prize_usd = '10';
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);
      const ps = fix._add_clash_param({ pid1, pid2, prize_usd });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { prize_usd: fix._add_usd(prize_usd, 0) });
    });


    it('fail if invalid', async () => {
      const prize_usd = '10.131';
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);
      const ps = fix._add_clash_param({ pid1, pid2, prize_usd });
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH, ps, 400);
    });
  });


  context('entry_fee_usd', function () {
    // NOTE: entry fee not in response

    it('set if valid, two precision digit', async () => {
      const entry_fee_usd = '10.13';
      const initial_balance_usd = '20.00';
      const [pid1, pid2] = await Promise.all([
        fix._add_player({ initial_balance_usd }),
        fix._add_player({ initial_balance_usd })
      ]);
      const ps = fix._add_clash_param({ pid1, pid2, entry_fee_usd });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303);
    });


    it('set if valid, one precision digit', async () => {
      const entry_fee_usd = '10.1';
      const initial_balance_usd = '20.00';
      const [pid1, pid2] = await Promise.all([
        fix._add_player({ initial_balance_usd }),
        fix._add_player({ initial_balance_usd })
      ]);
      const ps = fix._add_clash_param({ pid1, pid2, entry_fee_usd });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303);
    });


    it('set if valid, zero precision digit with decimal', async () => {
      const entry_fee_usd = '10.';
      const initial_balance_usd = '20.00';
      const [pid1, pid2] = await Promise.all([
        fix._add_player({ initial_balance_usd }),
        fix._add_player({ initial_balance_usd })
      ]);
      const ps = fix._add_clash_param({ pid1, pid2, entry_fee_usd });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303);
    });


    it('set if valid, zero precision digit', async () => {
      const entry_fee_usd = '10';
      const initial_balance_usd = '20.00';
      const [pid1, pid2] = await Promise.all([
        fix._add_player({ initial_balance_usd }),
        fix._add_player({ initial_balance_usd })
      ]);
      const ps = fix._add_clash_param({ pid1, pid2, entry_fee_usd });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303);
    });


    it('fail if invalid', async () => {
      const entry_fee_usd = '10.131';
      const initial_balance_usd = '20.00';
      const [pid1, pid2] = await Promise.all([
        fix._add_player({ initial_balance_usd }),
        fix._add_player({ initial_balance_usd })
      ]);
      const ps = fix._add_clash_param({ pid1, pid2, entry_fee_usd });
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH, ps, 400);
    });
  });

});
