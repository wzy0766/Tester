'use strict';

const { expect } = require('chai');

const DEFAULT_TIMEOUT_MS = 4e3;
const { Fixture } = require('../lib/fixture');


describe('GET /player/[pid]', function() {
  const DEFAULT_PATH   = (pid) => `/player/${pid}`;
  const DEFAULT_METHOD = 'get';

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());


  context('pid not exist', function() {
    it('response code is 404', function () {
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(999), {}, 404);
    });
  });


  context('pid exist', function () {
    it('response code is 200', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200);
    });

    it('response is valid player', async function () {
      const pid = await fix._add_player();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200);

      const d = JSON.parse(body);
      expect(d).to.be.a.model('player');
    });
  });


  context('pid', function () {
    it('response contains pid', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['pid']);
    });

    it('pid is int', async function () {
      const pid = await fix._add_player();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200);
      
      const { pid:_pid } = JSON.parse(body);
      expect(_pid).to.be.a('number').and.equal(pid);
      expect(_pid % 1).to.be.equal(0);
    });
  });


  context('name', function () {
    it('response contains name', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['name']);
    });

    it('fname + lname', async () => {
      const fname = 'player';
      const lname = 'last';
      const pid = await fix._add_player({ fname, lname });
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, { name: `${fname} ${lname}` });
    });

    it('lname blank', async () => {      
      const fname = 'player';
      const lname = '';
      const pid = await fix._add_player({ fname, lname });
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, { name: `${fname}` });
    });
  });


  context('handed', function () {
    it('response contains handed', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['handed']);      
    });

    it('handed enum', () => {
      const vals = ['left', 'right', 'ambi'];

      return Promise.map(vals, async val => {
        const pid = await fix._add_player({ handed: val });
        return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, { handed: val });
      });
    });
  });


  context('is_active', function () {
    it('response contains is_active', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['is_active']);      
    });

    it('is_active is boolean', async function () {
      const pid = await fix._add_player();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200);
      
      const { is_active } = JSON.parse(body);
      expect(is_active).to.be.a('boolean').and.equal(true);
    });
  });


  context('num_join', function () {
    it('response contains num_join', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['num_join']);
    });

    it('num_join is int', async function () {
      const pid = await fix._add_player();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200);
      
      const { num_join } = JSON.parse(body);
      expect(num_join).to.be.a('number').and.equal(0);
      expect(num_join % 1).to.be.equal(0);
    });
  });


  context('num_won', function () {
    it('response contains num_won', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['num_won']);
    });

    it('num_won is int', async function () {
      const pid = await fix._add_player();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200);
      
      const { num_won } = JSON.parse(body);
      expect(num_won).to.be.a('number').and.equal(0);
      // integer test
      expect(num_won % 1).to.be.equal(0);
    });
  });


  context('num_dq', function () {
    it('response contains num_dq', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['num_dq']);
    });

    it('num_dq is int', async function () {
      const pid = await fix._add_player();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200);
      
      const { total_points } = JSON.parse(body);
      expect(total_points).to.be.a('number').and.equal(0);
      expect(total_points % 1).to.be.equal(0);
    });
  });


  context('balance_usd', function () {
    it('response contains balance_usd', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['balance_usd']);
    });

    it('total_prize is currency', async function () {
      const initial_balance_usd = '12.34';
      const pid = await fix._add_player({ initial_balance_usd });
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, { balance_usd: initial_balance_usd });
    });
  });


  context('total_points', function () {
    it('response contains total_points', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['total_points']);
    });

    it('total_points is int', async function () {
      const pid = await fix._add_player();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200);
      
      const { total_points } = JSON.parse(body);
      expect(total_points).to.be.a('number').and.equal(0);
      expect(total_points % 1).to.be.equal(0);
    });
  });


  context('rank', function () {
    it('response contains rank', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['rank']);
    });

    it('rank is int > 0', async function () {
      const pid = await fix._add_player();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200);

      const { rank } = JSON.parse(body);
      expect(rank).to.be.a('number').and.at.least(1);
      expect(rank % 1).to.be.equal(0);
    });
  });


  context('spec_count', function () {
    it('response contains spec_count', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['spec_count']);
    });

    it('spec_count is int', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, { spec_count: 0 });
    });
  });


  context('total_prize_usd', function () {
    it('response contains total_prize_usd', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['total_prize_usd']);
    });

    it('total_prize_usd is currency', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, { total_prize_usd: '0.00' });
    });
  });


  context('efficiency', function () {
    it('response contains efficiency', async function () {
      const pid = await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(pid), {}, 200, ['efficiency']);
    });
  });
});


describe('GET /player', function() {
  const DEFAULT_PATH   = '/player';
  const DEFAULT_METHOD = 'get';

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());


  context('contains 0 player', function() {
    // clean-state (count)
    beforeEach(() => fix.truncate());

    it('response code is 200', async function () {
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
    });

    it('response is empty array', async function () {
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
      
      const d = JSON.parse(body);
      expect(d).to.be.an('array').with.length(0);
    });
  });

  
  context('contains 1 player', async function () {
    // clean-state (count)
    beforeEach(() => fix.truncate());

    it('response code is 200', async function () {
      await fix._add_player();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
    });

    it('response is array with length 1', async function () {
      await fix._add_player();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
      
      const d = JSON.parse(body);
      expect(d).to.be.an('array').with.length(1);

      for (const obj of d) {
        expect(obj).to.be.a.model('player');
      }
    });
  });


  context('contains 2 or more player', function () {
    // clean-state (count)
    beforeEach(() => fix.truncate());

    it('response code is 200', async function () {
      await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
    });

    it('response is array with length 2', async function () {
      await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
      
      const d = JSON.parse(body);
      expect(d).to.be.an('array').with.length(2);

      for (const obj of d) {
        expect(obj).to.be.a.model('player');
      }
    });
  });
  

  context('sort A-Z ASC', function () {
    // clean-state (count)
    beforeEach(() => fix.truncate());

    it('different first name', async function () {
      // create in order
      const vals = [
        { fname: 'c', lname: 'l' },
        { fname: 'b', lname: 'l' },
        { fname: 'a', lname: 'l' },
      ];
      const sorted_vals = vals.map(({ fname, lname }) => `${fname} ${lname}`).sort();

      await Promise.map(vals, ({ fname, lname }) => fix._add_player({ fname, lname }));

      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
      const objs = JSON.parse(body);

      const names = objs.map(({ name }) => name);
      expect(names).to.deep.equal(sorted_vals);
    });

    it('same first name', async function () {
      // create in order
      const vals = [
        { fname: 'f', lname: 'a' },
        { fname: 'f', lname: 'b' },
        { fname: 'f', lname: 'c' },
      ];
      const sorted_vals = vals.map(({ fname, lname }) => `${fname} ${lname}`).sort();

      await Promise.map(vals, ({ fname, lname }) => fix._add_player({ fname, lname }));

      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
      const objs = JSON.parse(body);

      const names = objs.map(({ name }) => name);
      expect(names).to.deep.equal(sorted_vals);
    });

    it('update re-orders', async function () {
      // create in order
      const vals = [
        { fname: 'f', lname: 'a' },
        { fname: 'f', lname: 'b' }
      ];
      const sorted_vals_pre = vals.map(({ fname, lname }) => `${fname} ${lname}`).sort();

      let body, names;

      const [pida,] = await Promise.map(vals, ({ fname, lname }) => fix._add_player({ fname, lname }));

      ({ body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200));
      (names = JSON.parse(body).map(({ name }) => name));
      expect(names).to.deep.be.equal(sorted_vals_pre);

      const new_lname = 'c';
      await fix.test_forward('POST', `/player/${pida}`, { lname: new_lname }, 303);
      
      // update vals, and get new order
      vals[0].lname = new_lname;
      const sorted_vals_post = vals.map(({ fname, lname }) => `${fname} ${lname}`).sort();

      ({ body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200));
      (names = JSON.parse(body).map(({ name }) => name));
      expect(names).to.deep.equal(sorted_vals_post);
    });
  });
});


describe('POST /player', function() {
  const DEFAULT_PATH   = '/player';
  const DEFAULT_METHOD = 'post';

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());


  context('response', function () {
    it('response_code is 303 on success', async () => {
      const ps = fix._add_player_param();
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303);
    });
  });


  // FNAME + LNAME
  context('name', function () {
    it('fname + lname', async () => {
      const fname = 'player';
      const lname = 'last';
      const ps = fix._add_player_param({ fname, lname });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { name: `${fname} ${lname}` });
    });

    it('fname blank', async () => {
      const fname = '';
      const ps = fix._add_player_param({ fname });
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH, ps, 422, 'fname');
    });

    it('fname invalid char', async () => {
      const fname = 'player1';
      const ps = fix._add_player_param({ fname });
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH, ps, 422, 'fname');
    });

    it('fname invalid space', async () => {
      const fname = 'player player';
      const ps = fix._add_player_param({ fname });
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH, ps, 422, 'fname');
    });
  });


  context('handed', function () {
    it('accept valid enum', () => {
      const vals = ['left', 'right', 'ambi'];

      return Promise.map(vals, val => {
        const ps = fix._add_player_param({ handed: val });
        return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { handed: val });
      });
    });


    it('no-accept invalid enum', () => {
      const vals = ['L', 'R'];

      return Promise.map(vals, val => {
        const ps = fix._add_player_param({ handed: val });
        return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH, ps, 422, 'handed');
      });
    });
  });


  context('initial_balance_usd', function () {
    it('set if valid, two precision digit', async () => {
      const val = '10.13';
      const ps = fix._add_player_param({ initial_balance_usd: val });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { balance_usd: parseFloat(val).toFixed(2) });
    });


    it('set if valid, one precision digit', async () => {
      const val = '10.1';
      const ps = fix._add_player_param({ initial_balance_usd: val });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { balance_usd: parseFloat(val).toFixed(2) });
    });


    it('set if valid, zero precision digit with decimal', async () => {
      const val = '10.';
      const ps = fix._add_player_param({ initial_balance_usd: val });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { balance_usd: parseFloat(val).toFixed(2) });
    });


    it('set if valid, zero precision digit', async () => {
      const val = '10';
      const ps = fix._add_player_param({ initial_balance_usd: val });
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { balance_usd: parseFloat(val).toFixed(2) });
    });


    it('fail if invalid', async () => {
      const val = '10.133';
      const ps = fix._add_player_param({ initial_balance_usd: val });
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH, ps, 422, 'balance_usd');
    });
  });


  context('is_active', function () {
    it('default is_active=true', async () => {
      const ps = fix._add_player_param();
      return fix.test_forward(DEFAULT_METHOD, DEFAULT_PATH, ps, 303, { is_active: true });
    });
  });
});
