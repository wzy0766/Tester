'use strict';

const { expect } = require('chai');

const DEFAULT_TIMEOUT_MS = 4e3;
const { Fixture } = require('../lib/fixture');


describe('GET /clash/[cid]', function() {
  const DEFAULT_PATH   = (cid) => `/clash/${cid}`;
  const DEFAULT_METHOD = 'get';

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());


  context('cid not exist', function() {
    it('response code is 404', function () {
      return fix.test_fail(DEFAULT_METHOD, DEFAULT_PATH(999), {}, 404);
    });
  });


  context('cid exist', function () {
    it('response code is 200', async function () {
      const { cid } = await fix._add_clash();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200);
    });

    it('response is valid clash', async function () {
      const { cid } = await fix._add_clash();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200);

      const d = JSON.parse(body);
      expect(d).to.be.a.model('clash');
    });
  });


  context('cid', function () {
    it('response contains cid', async function () {
      const { cid } = await fix._add_clash();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, ['cid']);
    });

    it('cid is int', async function () {
      const { cid } = await fix._add_clash();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200);
      
      const { cid:_cid } = JSON.parse(body);
      expect(_cid).to.be.a('number').and.equal(cid);
      expect(_cid % 1).to.be.equal(0);
    });
  });


  context('id', function () {
    it('response contains ids', async function () {
      const { cid } = await fix._add_clash();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, ['p1_id', 'p2_id']);
    });


    it('ids match player', async function () {
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player(),
      ])

      const { cid } = await fix._add_clash({ pid1, pid2 });
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200);
      
      const { p1_id, p2_id } = JSON.parse(body);
      expect(p1_id).to.be.a('number').and.equal(pid1);
      expect(p1_id % 1).to.be.equal(0);
      expect(p2_id).to.be.a('number').and.equal(pid2);
      expect(p2_id % 1).to.be.equal(0);

    });
  });


  context('name', function () {
    it('response contains names', async function () {
      const { cid } = await fix._add_clash();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, ['p1_name', 'p2_name']);
    });


    it('names match player', async function () {
      const PLAYER1_FNAME = 'pp';
      const PLAYER1_LNAME = 'pplast';
      const PLAYER2_FNAME = 'qq';
      const PLAYER2_LNAME = 'qlast';

      const [pid1, pid2] = await Promise.all([
        fix._add_player({ fname:PLAYER1_FNAME, lname:PLAYER1_LNAME }),
        fix._add_player({ fname:PLAYER2_FNAME, lname:PLAYER2_LNAME }),
      ])

      const { cid } = await fix._add_clash({ pid1, pid2 });
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, {
        p1_name: `${PLAYER1_FNAME} ${PLAYER1_LNAME}`,
        p2_name: `${PLAYER2_FNAME} ${PLAYER2_LNAME}`
      });
    });
  });


  context('is_active', function () {
    it('response contains is_active', async function () {
      const { cid } = await fix._add_clash();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, ['is_active']);      
    });

    it('is_active is boolean', async function () {
      const { cid } = await fix._add_clash();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200);
      
      const { is_active } = JSON.parse(body);
      expect(is_active).to.be.a('boolean').and.equal(true);
    });
  });


  context('prize_usd', function () {
    it('response contains prize_usd', async function () {
      const { cid } = await fix._add_clash();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, ['prize_usd']);
    });

    it('total_prize is currency', async function () {
      const prize_usd = '5.43';
      const { cid } = await fix._add_clash({ prize_usd });
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, { prize_usd });
    });
  });


  context('attendance', function () {
    it('response contains attendance', async function () {
      const { cid } = await fix._add_clash();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, ['attendance']);
    });

    it('attendance is int', async function () {
      const { cid } = await fix._add_clash();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200);
      
      const { attendance } = JSON.parse(body);
      expect(attendance).to.be.a('number').and.equal(0);
      expect(attendance % 1).to.be.equal(0);
    });
  });


  context('points', function () {
    it('response contains points', async function () {
      const { cid } = await fix._add_clash();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, ['p1_points', 'p2_points']);
    });


    it('points is int', async function () {
      const { cid } = await fix._add_clash();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200);
      
      const { p1_points, p2_points } = JSON.parse(body);
      expect(p1_points).to.be.a('number').and.equal(0);
      expect(p1_points % 1).to.be.equal(0);
      expect(p2_points).to.be.a('number').and.equal(0);
      expect(p2_points % 1).to.be.equal(0);
    });
  });


  context('winner_pid', function () {
    it('response contains winner_pid', async function () {
      const { cid } = await fix._add_clash();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, ['winner_pid']);
    });


    it('(active) winner_pid is null', async function () {
      const { cid } = await fix._add_clash();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200);
      
      const { winner_pid } = JSON.parse(body);
      expect(winner_pid).to.be.null;
    });


    it('(complete) winner_pid is int', async function () {
      const { cid, pid1, pid2 } = await fix._add_clash();
      // disqualify to end
      await fix._disqualify(cid, pid1);

      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200);
      
      const { winner_pid } = JSON.parse(body);
      expect(winner_pid).to.be.a('number').and.equal(pid2);
      expect(winner_pid % 1).to.be.equal(0);
    });
  });


  context('ends_at', function () {
    it('response contains ends_at', async function () {
      const { cid, pid1 } = await fix._add_clash();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, ['ends_at']);
    });


    it('(active) ends_at is null', async function () {
      const { cid } = await fix._add_clash();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200);
      
      const { ends_at } = JSON.parse(body);
      expect(ends_at).to.be.null;
    });


    it('(complete) ends_at is datetime string', async function () {
      const { cid, pid1 } = await fix._add_clash();
      // disqualify to end
      await fix._disqualify(cid, pid1);

      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200);
      
      const { ends_at } = JSON.parse(body);
      expect(ends_at).to.be.valid.iso8601;
    });
  });


  context('age', function () {
    it('response contains age', async function () {
      const { cid } = await fix._add_clash();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200, ['age']);
    });


    it('age is int', async function () {
      const { cid } = await fix._add_clash();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH(cid), {}, 200);
      
      const { age } = JSON.parse(body);
      // assuming test within 2 sec
      expect(age).to.be.a('number').most(2);
      expect(age % 1).to.be.equal(0);
    });
  });
});


describe('GET /clash', function() {
  const DEFAULT_PATH   = '/clash';
  const DEFAULT_METHOD = 'get';

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());


  context('contains 0 clashes', function() {
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

  
  context('contains 1 clash', async function () {
    // clean-state (count)
    beforeEach(() => fix.truncate());

    it('response code is 200', async function () {
      await fix._add_clash();
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
    });

    it('response is array with length 1', async function () {
      await fix._add_clash();
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
      
      const d = JSON.parse(body);
      expect(d).to.be.an('array').with.length(1);

      for (const obj of d) {
        expect(obj).to.be.a.model('clash');
      }
    });
  });


  context('contains 2 or more clash', async function () {
    // clean-state (count)
    beforeEach(() => fix.truncate());

    it('response code is 200', async function () {
      await Promise.all([
        fix._add_clash(),
        fix._add_clash()
      ])
      return fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
    });

    it('response is array with length 2', async function () {
      await Promise.all([
        fix._add_clash(),
        fix._add_clash()
      ])
      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);      
      
      const d = JSON.parse(body);
      expect(d).to.be.an('array').with.length(2);

      for (const obj of d) {
        expect(obj).to.be.a.model('clash');
      }
    });
  });
  

  context('sort clashes', function () {
    // clean-state (count)
    beforeEach(() => fix.truncate());

    it('active, prize_usd DESC', async function () {
      // insert in order
      const vals = [
        '6.00',
        '5.00',
        '7.00',
        '1.00',
        '9.00'
      ];
      const sorted_vals = vals.sort().reverse();

      await Promise.map(vals, prize_usd => fix._add_clash({ prize_usd }));

      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
      const objs = JSON.parse(body);

      const prize_usds = objs.map(({ prize_usd }) => prize_usd);
      expect(prize_usds).to.deep.equal(sorted_vals);
    });


    it('at most 4 not-active', async function () {
      const EXP_MAX_LENGTH = 4;
      
      // insert in order
      const vals = [
        '6.00',
        '5.00',
        '7.00',
        '1.00',
        '9.00'
      ];

      const ids = await Promise.map(vals, prize_usd => fix._add_clash({ prize_usd }));
      await Promise.map(ids, async ({ cid, pid1 }) => {
        await fix._award_points(cid, pid1);
        await fix._end_clash(cid);
      })

      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
      const objs = JSON.parse(body);

      expect(objs).to.have.length(Math.min(EXP_MAX_LENGTH, vals.length));
    });


    it('active before not-active', async function () {      
      // insert in order
      const vals = [
        '1.00',
        '6.00',
        '5.00',
        '7.00'
      ];

      const ids = await Promise.map(vals, prize_usd => fix._add_clash({ prize_usd }));

      const not_active_ids = [ids[1], ids[2]];
      // const active_cids = [ids[0], ids[3]];
      // active only, indexes match above, manual sort based on vals
      const sorted_active_cids = [ids[3].cid, ids[0].cid];
      const not_active_cids = [ids[1].cid, ids[2].cid];

      await Promise.map(not_active_ids, async ({ cid, pid1 }) => {
        await fix._award_points(cid, pid1);
        await fix._end_clash(cid);
      });

      const { body } = await fix.test_succeed(DEFAULT_METHOD, DEFAULT_PATH, {}, 200);
      const objs = JSON.parse(body);

      const cids = objs.map(({ cid }) => cid);
      expect(cids.slice(0, 2)).to.deep.equal(sorted_active_cids);
      expect(cids.slice(2, 4)).to.deep.members(not_active_cids);
    });
  });
});
