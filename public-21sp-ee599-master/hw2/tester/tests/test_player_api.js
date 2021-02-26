'use strict';

const { expect } = require('chai');

const DEFAULT_TIMEOUT_MS = 4e3;
const { Fixture } = require('../lib/fixture');


describe('POST /player/[pid]', function() {
  const DEFAULT_PATH   = (pid) => `/player/${pid}`;
  const DEFAULT_METHOD = 'POST';

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());


  context('pid exist', function () {
    it('response_code is 303', async () => {
      const pid = await fix._add_player();
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 303);
    });
  });


  context('pid not exist', function() {
    it('response code is 404', function () {
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(999), {}, 404);
    });
  });


  context('lname', function () {
    it('response code is 303', async function () {
      let lname = 'lname';

      const pid = await fix._add_player({ lname });

      lname = 'lnamep';
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { lname }, 303);
    });

    it('update', async function () {
      const fname = 'pp';
      let lname = 'lname';

      const pid = await fix._add_player({ fname, lname });

      lname = 'lnamep';
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { lname }, 303, { name: `${fname} ${lname}` });
    });

    it('update to same', async function () {
      const fname = 'pp';
      let lname = 'lname';

      const pid = await fix._add_player({ fname, lname });

      lname = 'lname';
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { lname }, 303, { name: `${fname} ${lname}` });
    });

    it('update to empty', async function () {
      const fname = 'pp';
      let lname = 'lname';

      const pid = await fix._add_player({ fname, lname });

      lname = '';
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { lname }, 303, { name: `${fname}` });
    });
  });


  context('active', function () {
    it('active => inactive', async function () {
      const pid = await fix._add_player();
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { active: 'f' }, 303, { is_active: false });
    });

    it('inactive => active', async function () {
      const pid = await fix._add_player();
      await fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { active: 'f' }, 303, { is_active: false });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { active: 't' }, 303, { is_active: true });
    });

    it('validate true boolean input', function () {
      const test_vals = ['1', 't', 'true', 'T', 'TRUE'];

      return Promise.map(test_vals, async val => {
        const pid = await fix._add_player();
        // deactivate
        await fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { active: 'f' }, 303, { is_active: false });
        // re-activate
        const { body } = await fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH(pid), { active: val }, 303);
        const { is_active } = JSON.parse(body);
        expect(is_active).to.be.a('boolean').and.equal(true);
      });
    });
  });
});



describe('POST /deposit/player', function() {
  const DEFAULT_PATH   = (pid) => `/deposit/player/${pid}`;
  const DEFAULT_METHOD = 'POST';

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());


  context('pid exist', function () {
    it('response_code is 200', async () => {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), { amount_usd: '0.00' }, 200);
    });

    it('response is balance_usd model', async function () {
      const pid = await fix._add_player();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), { amount_usd: '0.00' }, 200);

      const d = JSON.parse(body);
      expect(d).to.be.a.model('player_balance');
    });
  });


  context('pid not exist', function() {
    it('response code is 404', function () {
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(999), { amount_usd: '0.00' }, 404);
    });
  });


  context('amount_usd', function () {
    it('incremement zero balance', async function() {
      const initial_balance_usd = '0.00';
      const amount_usd = '1.23';
      const pid = await fix._add_player({ initial_balance_usd });
      await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), { amount_usd }, 200, { old_balance_usd: initial_balance_usd, new_balance_usd: amount_usd });
    });

    it('incremement non-zero balance', async function() {
      const initial_balance_usd = '1.00';
      const amount_usd = '1.23';
      const pid = await fix._add_player({ initial_balance_usd });
      const new_balance_usd = fix._add_usd(initial_balance_usd, amount_usd)
      await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), { amount_usd }, 200, { old_balance_usd: initial_balance_usd, new_balance_usd });
    });

    it('allow zero deposit', function() {
      const test_vals = ['0', '0.0', '0.00'];
      const initial_balance_usd = '1.00';

      return Promise.map(test_vals, async val => {
        const pid = await fix._add_player({ initial_balance_usd });
        await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), { amount_usd: val }, 200, { old_balance_usd: initial_balance_usd, new_balance_usd: initial_balance_usd });
      });
    });

    it('allow valid currency', function() {
      const test_vals = ['1.21', '1.2', '1.0', '1'];
      const initial_balance_usd = '1.00';

      return Promise.map(test_vals, async val => {
        const pid = await fix._add_player({ initial_balance_usd });
        const new_balance_usd = fix._add_usd(initial_balance_usd, val);
        await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), { amount_usd: val }, 200, { new_balance_usd });
      });
    });

    it('400 if empty amount_usd', async function() {
      const pid = await fix._add_player();
      await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 400);
    });

    it('400 if invalid currency', function() {
      const test_vals = ['1.211', 'one', '-1.00'];

      return Promise.map(test_vals, async val => {
        const pid = await fix._add_player();
        await fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(pid), { amount_usd: val }, 400);
      });
    });
  });
});
