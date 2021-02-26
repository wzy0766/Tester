'use strict';

const { expect } = require('chai');

const DEFAULT_TIMEOUT_MS = 4e3;
const { Fixture } = require('../lib/fixture');

const CLOSE_TO_TOL = 1e-2;


describe('player stats', function() {
  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());

  context('num_join', function () {
    it('increments on /clash', async function () {
      const [pid1, pid2, pid3] = await Promise.all([
        fix._add_player(),
        fix._add_player(),
        fix._add_player()
      ]);

      let cid, num_join;
      
      ({ num_join } = await fix._get_player(pid1))
      expect(num_join).to.equal(0);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      
      ({ num_join } = await fix._get_player(pid1))
      expect(num_join).to.equal(1);

      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);
      
      ({cid} = await fix._add_clash({ pid1, pid3 }));
      
      ({ num_join } = await fix._get_player(pid1))
      expect(num_join).to.equal(2);
    });

    it('no increment fail /clash', async function () {
      const [pid1, pid2, pid3] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      let num_join;
      
      ({ num_join } = await fix._get_player(pid1))
      expect(num_join).to.equal(0);

      const entry_fee_usd = 'Invalid';
      const ps = fix._add_clash_param({ pid1, pid2, entry_fee_usd });      
      await fix.test_fail('POST', '/clash', ps);
      
      ({ num_join } = await fix._get_player(pid1))
      expect(num_join).to.equal(0);
    });
  });


  context('num_won', function () {
    it('increments on /clash end', async function () {
      const [pid1, pid2, pid3] = await Promise.all([
        fix._add_player(),
        fix._add_player(),
        fix._add_player()
      ]);

      let cid, num_won;
      
      ({ num_won } = await fix._get_player(pid1))
      expect(num_won).to.equal(0);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
              
      ({ num_won } = await fix._get_player(pid1))
      expect(num_won).to.equal(0);

      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);
      
      ({ num_won } = await fix._get_player(pid1))
      expect(num_won).to.equal(1);
      
      ({cid} = await fix._add_clash({ pid1, pid3 }));

      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);
              
      ({ num_won } = await fix._get_player(pid1))
      expect(num_won).to.equal(2);
    });

    it('no increment on lose', async function () {
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      let cid, num_won;
      
      ({ num_won } = await fix._get_player(pid1))
      expect(num_won).to.equal(0);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
              
      ({ num_won } = await fix._get_player(pid1));
      expect(num_won).to.equal(0);

      await fix._award_points(cid, pid2);
      await fix._end_clash(cid);
      
      ({ num_won } = await fix._get_player(pid1))
      expect(num_won).to.equal(0);
    });
  });


  context('num_dq', function () {
    it('increments on dq', async function () {
      const [pid1, pid2, pid3] = await Promise.all([
        fix._add_player(),
        fix._add_player(),
        fix._add_player()
      ]);

      let cid, num_dq;
      
      ({ num_dq } = await fix._get_player(pid1))
      expect(num_dq).to.equal(0);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
              
      ({ num_dq } = await fix._get_player(pid1));
      expect(num_dq).to.equal(0);

      await fix._disqualify(cid, pid1);
      
      ({ num_dq } = await fix._get_player(pid1))
      expect(num_dq).to.equal(1);
      
      ({cid} = await fix._add_clash({ pid1, pid3 }));

      await fix._disqualify(cid, pid1);
              
      ({ num_dq } = await fix._get_player(pid1))
      expect(num_dq).to.equal(2);
    });

    it('no increment other player dq', async function () {
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      let cid, num_dq;
      
      ({ num_dq } = await fix._get_player(pid1))
      expect(num_dq).to.equal(0);

      ({cid} = await fix._add_clash({ pid1, pid2 }));

      await fix._disqualify(cid, pid2);
              
      ({ num_dq } = await fix._get_player(pid1));
      expect(num_dq).to.equal(0);
    });

    it('no increment on lose', async function () {
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      let cid, num_dq;
      
      ({ num_dq } = await fix._get_player(pid1))
      expect(num_dq).to.equal(0);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
              
      ({ num_dq } = await fix._get_player(pid1));
      expect(num_dq).to.equal(0);

      await fix._award_points(cid, pid2);
      await fix._end_clash(cid);
      
      ({ num_dq } = await fix._get_player(pid1))
      expect(num_dq).to.equal(0);
    });
  });


  context('total_points', function () {
    it('increments on award', async function () {
      const points = 2;
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      let cid, total_points;
      
      ({ total_points } = await fix._get_player(pid1))
      expect(total_points).to.equal(0);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      
      await fix._award_points(cid, pid1, points);      
      ({ total_points } = await fix._get_player(pid1))
      expect(total_points).to.equal(1 * points);

      
      await fix._award_points(cid, pid1, points);      
      ({ total_points } = await fix._get_player(pid1))
      expect(total_points).to.equal(2 * points);
    });

    it('total over multiple clash', async function () {
      const points = 2;
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      let cid, total_points;
      
      ({ total_points } = await fix._get_player(pid1))
      expect(total_points).to.equal(0);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      
      await fix._award_points(cid, pid1, points);      
      ({ total_points } = await fix._get_player(pid1))
      expect(total_points).to.equal(1 * points);

      await fix._end_clash(cid);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      
      await fix._award_points(cid, pid1, points);      
      ({ total_points } = await fix._get_player(pid1))
      expect(total_points).to.equal(2 * points);
    });
    
    it('no increment other player award', async function () {
      const points = 2;
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      let cid, total_points;
      
      ({ total_points } = await fix._get_player(pid1))
      expect(total_points).to.equal(0);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      
      await fix._award_points(cid, pid2, points);
      ({ total_points } = await fix._get_player(pid1))
      expect(total_points).to.equal(0);
    });
  });


  context('total_prize_usd', function () {
    it('increments on win', async function () {
      const prize_usd = '1.23';
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      let cid, total_prize_usd, exp_prize_usd = 0;
      
      ({ total_prize_usd } = await fix._get_player(pid1))
      expect(total_prize_usd).to.equal(fix._to_currency(exp_prize_usd));

      ({cid} = await fix._add_clash({ pid1, pid2, prize_usd }));

      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);
      exp_prize_usd = fix._add_usd(0, prize_usd);
      
      ({ total_prize_usd } = await fix._get_player(pid1))
      expect(total_prize_usd).to.equal(fix._to_currency(exp_prize_usd)); 
    });

    it('total over multiple clash', async function () {
      const prize_usd = '1.23';
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      let cid, total_prize_usd, exp_prize_usd = 0;
      
      ({ total_prize_usd } = await fix._get_player(pid1))
      expect(total_prize_usd).to.equal(fix._to_currency(exp_prize_usd));

      ({cid} = await fix._add_clash({ pid1, pid2, prize_usd }));

      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);
      exp_prize_usd = fix._add_usd(exp_prize_usd, prize_usd);
      
      ({ total_prize_usd } = await fix._get_player(pid1))
      expect(total_prize_usd).to.equal(fix._to_currency(exp_prize_usd));

      ({cid} = await fix._add_clash({ pid1, pid2, prize_usd }));

      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);
      exp_prize_usd = fix._add_usd(exp_prize_usd, prize_usd);
      
      ({ total_prize_usd } = await fix._get_player(pid1))
      expect(total_prize_usd).to.equal(fix._to_currency(exp_prize_usd));

    });

    it('no increment on lose', async function () {
      const prize_usd = '1.00';
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      let cid, total_prize_usd;
      
      ({ total_prize_usd } = await fix._get_player(pid1))
      expect(total_prize_usd).to.equal('0.00');

      ({cid} = await fix._add_clash({ pid1, pid2, prize_usd }));

      await fix._award_points(cid, pid2);
      await fix._end_clash(cid);
      
      ({ total_prize_usd } = await fix._get_player(pid1))
      expect(total_prize_usd).to.equal('0.00');
    });
  });

  
  // NOTE: only consider non-tie conditions
  context('rank, 1 player', function () {
    // clean-state (rank)
    beforeEach(() => fix.truncate());

    it('rank equals 1', async function () {
      const pid = await fix._add_player();
      
      const { rank } = await fix._get_player(pid);
      expect(rank).to.equal(1);
    });
  });


  context('rank, 2 player', function () {
    // clean-state (rank)
    beforeEach(() => fix.truncate());

    it('1 clash, player: win', async function () {
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      const {cid} = await fix._add_clash({ pid1, pid2 });
      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);

      const { rank } = await fix._get_player(pid1);
      expect(rank).to.equal(1);
    });

    
    it('1 clash, player: lose', async function () {
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      const {cid} = await fix._add_clash({ pid1, pid2 });
      await fix._award_points(cid, pid2);
      await fix._end_clash(cid);

      const { rank } = await fix._get_player(pid1);
      expect(rank).to.equal(2);
    });

    
    it('3 clash, player: lose,win,win', async function () {
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      let cid;

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      await fix._award_points(cid, pid2);
      await fix._end_clash(cid);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);

      const { rank } = await fix._get_player(pid1);
      expect(rank).to.equal(1);
    });
  });


  context('rank, 2+ player', function () {
    // clean-state (rank)
    beforeEach(() => fix.truncate());
    
    it('win only', async function () {
      const [pid1, pid2, pid3] = await Promise.all([
        fix._add_player(),
        fix._add_player(),
        fix._add_player()
      ]);

      let cid;

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);

      ({cid} = await fix._add_clash({ pid1, pid2:pid3 }));
      await fix._award_points(cid, pid3);
      await fix._end_clash(cid);

      const { rank } = await fix._get_player(pid1);
      expect(rank).to.equal(1);
    });

    it('other players win', async function () {
      const [pid1, pid2, pid3] = await Promise.all([
        fix._add_player(),
        fix._add_player(),
        fix._add_player()
      ]);

      let cid;

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      await fix._award_points(cid, pid2);
      await fix._end_clash(cid);

      const { rank } = await fix._get_player(pid3);
      expect(rank).to.equal(3);
    });

    it('win some, lose some', async function () {
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player(),
        fix._add_player()
      ]);

      let cid;

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      await fix._award_points(cid, pid2);
      await fix._end_clash(cid);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      await fix._award_points(cid, pid2);
      await fix._end_clash(cid);

      const { rank } = await fix._get_player(pid1);
      expect(rank).to.equal(2);
    });
  });


  context('efficiency', function () {
    it('default is zero', async function () {
      const pid = await fix._add_player();
      
      const { efficiency } = await fix._get_player(pid);
      expect(efficiency).to.equal(0);
    });
    
    it('only count complete clash - not leader active', async function () {
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      const {cid} = await fix._add_clash({ pid1, pid2 });

      await fix._award_points(cid, pid2);
      
      const { efficiency } = await fix._get_player(pid1);
      expect(efficiency).to.equal(0);
    });
    
    it('only count complete clash - leader active', async function () {
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      const {cid} = await fix._add_clash({ pid1, pid2 });

      await fix._award_points(cid, pid1);
      
      const { efficiency } = await fix._get_player(pid1);
      expect(efficiency).to.equal(0);
    });
    
    it('sequential correct value', async function () {
      const [pid1, pid2] = await Promise.all([
        fix._add_player(),
        fix._add_player()
      ]);

      let cid, efficiency;

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);
      
      ({ efficiency } = await fix._get_player(pid1));
      expect(parseFloat(efficiency)).to.be.closeTo(1/1 * 100, CLOSE_TO_TOL);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      await fix._award_points(cid, pid2);
      await fix._end_clash(cid);
      
      ({ efficiency } = await fix._get_player(pid1));
      expect(parseFloat(efficiency)).to.be.closeTo(1/2 * 100, CLOSE_TO_TOL);

      ({cid} = await fix._add_clash({ pid1, pid2 }));
      await fix._award_points(cid, pid1);
      await fix._end_clash(cid);
      
      ({ efficiency } = await fix._get_player(pid1));
      expect(parseFloat(efficiency)).to.be.closeTo(2/3 * 100, CLOSE_TO_TOL);
    });
  });
});
