'use strict';

require('./assert');

/* TODO

  x  GET  /player
  x  GET  /player/[pid]
  x  POST /player
  x  POST /player/[pid]
  x  POST /deposit/player/[pid]
  x  GET  /clash
  x  GET  /clash/[cid]
  x  POST /clash
  x  POST /clash/[cid]/award/[pid]
  x  POST /clash/[cid]/end
  x  POST /clash/[cid]/disqualify/[pid]
  x  GET  /ping
  x  POST /admin/pre

  x  misc: invalid pages = 404
  x   misc: stats
  x   misc: sort players
  x   misc: sort clash
*/


const { _ } = require('lodash');

const chai = require('chai');
const { expect } = chai;

const axios = require('axios');
const querystring = require('querystring');
const fs = require('fs');

const {
  random_string
} = require('./util');

const { Process } = require('./process');

const INTERPRETER = 'python3';
//const SCRIPT_TO_TEST = `${__dirname}/../hw2p1.py`;
const SCRIPT_TO_TEST = `${__dirname}/../hw2p1.py`;
const DEFAULT_TIMEOUT_MS = 5e3;
const START_SCRIPT = true;

const TEST_PATH = '/ping';
const LIVE_TEST_INTERVAL_MS = 100;
const LIVE_TIMEOUT_MS = 2e3;

const {
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  user: MYSQL_USER,
  pass: MYSQL_PASS,
  db:   MYSQL_DATABASE
} = require(`${__dirname}/../config/mysql.json`);

const DEFAULT_SCHEMA_FILE = `${__dirname}/../schema.sql`;

const EXTRA_PROCESS_OPTS = {
  printOnClose: false
};

const URL_MAP = {
  GET_PLAYER: {
    method: 'GET',
    path:   (pid) => `/player/${pid}`
  },
  ADD_PLAYER: {
    method: 'POST',
    path:   '/player'
  },
  ADD_CLASH: {
    method: 'POST',
    path:   '/clash'
  },
  AWARD: {
    method: 'POST',
    path:   (cid, pid) => `/clash/${cid}/award/${pid}`
  },
  DISQUALIFY: {
    method: 'POST',
    path:   (cid, pid) => `/clash/${cid}/disqualify/${pid}`
  },
  END_CLASH: {
    method: 'POST',
    path:   (cid) => `/clash/${cid}/end`
  },
};


// player defaults
const DEFAULT_FNAME   = random_string();
const DEFAULT_LNAME   = random_string();
const DEFAULT_HANDED  = 'left';
const DEFAULT_INITIAL = '5.66';

// clash defaults
const DEFAULT_ENTRY_FEE = '1.25';
const DEFAULT_PRIZE =     '2.30';


// REUSABLE
let url, body, status, headers;

class Fixture {
  constructor() {
    this.wwwProtocol = 'http:';
    this.wwwHostname = 'localhost';
    this.wwwPort = '3000';

    this.defaultAxiosOpts = {
      transformResponse: [],
      validateStatus:    () => true,
      maxRedirects:      0
    };
  }


  async before() {
    await this._create_schma(DEFAULT_SCHEMA_FILE);

    if (START_SCRIPT) {
      await this.start();
    }
  
    const url = this.url('/admin/pre');
    return this.request('POST', url);
  }


  async truncate() {
    const cmd = 'mysql';
    const args = ['-h', MYSQL_HOST, '-P', MYSQL_PORT, '-u',  MYSQL_USER, '--protocol', 'TCP', '-e', 'DELETE FROM player; DELETE FROM clash;', MYSQL_DATABASE];
    const env = { MYSQL_PWD: MYSQL_PASS };
    return new Process(cmd, args).startSync({ env, timeout: 1e3 }, {printOnClose:true});
  }


  _create_schma(schemaFile) {
    const cmd = 'mysql';
    const args = ['-h', MYSQL_HOST, '-P', MYSQL_PORT, '-u',  MYSQL_USER, '--protocol', 'TCP'];
    const input = fs.readFileSync(schemaFile);
    const env = { MYSQL_PWD: MYSQL_PASS };
    return new Process(cmd, args).startSync({ env, input, timeout: 1e3 });
  }


  async after() {
    if (START_SCRIPT) {
      await this.stop();
    }
  }


  async start() {
    this.ps = new Process(INTERPRETER, [SCRIPT_TO_TEST], EXTRA_PROCESS_OPTS);
    this.ps.start(DEFAULT_TIMEOUT_MS);

    await this.ps.waitSpawn();

    return new Promise((resolve, reject) => {
      const url = this.url(TEST_PATH);

      const intervalId = setInterval(async () => {
        try {
          await axios(url);
          clearTimeout(timeoutId);
          clearInterval(intervalId);
          resolve();
        } catch(e) {
          // fallthrough
        }
      }, LIVE_TEST_INTERVAL_MS);
  
      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        reject(new Error(`timeout: web server not live -- timeout:${LIVE_TIMEOUT_MS}, url:${url}`));
      }, LIVE_TIMEOUT_MS);

      this.ps.waitError().catch(err => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        reject(new Error(`premature exit, ${this.ps.toString()} -- err:${err.message}`));
      });
    });    
  }


  async stop() {
    this.ps.kill();
    return this.ps.waitExit();
  }


  // REQUEST UTILS

  url(pathname, params = {}) {
    // default
    const url = new URL(`http://localhost${pathname}`);

    if (this.wwwProtocol) {
      url.protocol = this.wwwProtocol;
    }

    if (this.wwwHostname) {
      url.hostname = this.wwwHostname;
    }

    if (this.wwwPort) {
      url.port = this.wwwPort;
    }

    if (Object.keys(params).length > 0) {
      url.search = querystring.stringify(params);
    }

    return url.toString();
  }


  // check that response contains exp_partial (at least)
  // if object, check keys+vals; if array, check keys
  async test_succeed(method, path, ps, exp_status_code = null, exp_partial = null) {
    url = this.url(path, ps);
    ({ body, status, headers } = await this.request(method, url));

    if (!_.isNil(exp_status_code)) {
      expect(status).to.be.equal(exp_status_code);
    }

    expect(body).to.be.valid.json;
    const d = JSON.parse(body);

    if (_.isArray(exp_partial)) {
      for (const exp_key of exp_partial) {
        expect(d).to.have.property(exp_key);
      }
    }

    if (_.isPlainObject(exp_partial)) {
      for (const exp_key in exp_partial) {
        expect(d).to.have.property(exp_key);
        expect(d[exp_key]).to.equal(exp_partial[exp_key]);
      }
    }

    return { body, headers, status };
  }


  async test_forward(method, path, ps, exp_status_code = null, exp_partial = null) {
    url = this.url(path, ps);
    ({ body, status, headers } = await this.request(method, url));

    if (!_.isNil(exp_status_code)) {
      expect(status).to.be.equal(exp_status_code);
    }
    
    expect(body).to.be.equal('');
    
    // redirected request
    expect(headers).to.have.property('location');
    return this.test_succeed('GET', headers.location, {}, null, exp_partial);
  }


  async test_fail(method, path, ps, exp_status_code = null, exp_key = null) {
    url = this.url(path, ps);
    ({ body, status, headers } = await this.request(method, url));

    if (!_.isNil(exp_status_code)) {
      expect(status).to.be.equal(exp_status_code);
    }

    if (!_.isNil(exp_key)) {
      expect(body).to.include(exp_key);
    }

    return { body, headers, status };
  }


  async request(method, url, axiosOpts = {}) {
    axiosOpts = {...axiosOpts, ...this.defaultAxiosOpts};

    const res = await axios({
      method,
      url,
      data: '',
      ...axiosOpts
    });
    
    return { body: res.data, headers: res.headers, status: res.status };
  }


  // ENTITY HELPERS
  
  // return params obj, use params and replace missing with DEFAULT
  _add_player_param(params) {
    const DEFAULT_PARAMS = {
      fname:               DEFAULT_FNAME,
      lname:               DEFAULT_LNAME,
      handed:              DEFAULT_HANDED,
      initial_balance_usd: DEFAULT_INITIAL
    }

    return { ...DEFAULT_PARAMS, ...params };
  }


  // add player with params (uses _add_player_params as defaults)
  // return pid
  async _add_player(params = {}) {
    const ps = this._add_player_param(params);

    url = this.url(URL_MAP.ADD_PLAYER.path, ps);
    ({ status, headers } = await this.request(URL_MAP.ADD_PLAYER.method, url));

    expect(status).to.be.equal(303);
    // axios uses lower-case
    expect(headers).to.have.property('location');
    expect(headers['location']).to.match(/^\/player\/(\d+)$/);

    const [, pid] = headers['location'].match(/^\/player\/(\d+)$/);
    return parseInt(pid, 10);
  }
  

  // return params obj, use params and replace missing with DEFAULT
  _add_clash_param(params) {
    const DEFAULT_PARAMS = {
      // pid1 + pid2 must be defined
      entry_fee_usd: DEFAULT_ENTRY_FEE,
      prize_usd:     DEFAULT_PRIZE
    }

    return { ...DEFAULT_PARAMS, ...params };
  }


  // add clash with params, creates player if pidX null
  // return { cid, pid1, pid2 }
  async _add_clash(params = {}) {
    const [pid1, pid2] = await Promise.all([
      'pid1' in params ? params.pid1 : this._add_player(),
      'pid2' in params ? params.pid2 : this._add_player()
    ]);

    params.pid1 = pid1;
    params.pid2 = pid2;

    const ps = this._add_clash_param(params);

    url = this.url(URL_MAP.ADD_CLASH.path, ps);
    ({ status, headers } = await this.request(URL_MAP.ADD_CLASH.method, url));

    expect(status).to.be.equal(303);
    // axios uses lower-case
    expect(headers).to.have.property('location');
    expect(headers['location']).to.match(/^\/clash\/(\d+)$/);

    const [, cid] = headers['location'].match(/^\/clash\/(\d+)$/);
    return { cid: parseInt(cid, 10), pid1, pid2 };
  }


  async _disqualify(cid, pid) {
    url = this.url(URL_MAP.DISQUALIFY.path(cid, pid));
    ({ status } = await this.request(URL_MAP.DISQUALIFY.method, url));

    expect(status).to.be.equal(200);
  }

  async _award_points(cid, pid, points = 1) {
    url = this.url(URL_MAP.AWARD.path(cid, pid), { points });
    ({ status } = await this.request(URL_MAP.AWARD.method, url));

    expect(status).to.be.equal(200);
  }


  async _end_clash(cid) {
    url = this.url(URL_MAP.END_CLASH.path(cid));
    ({ status } = await this.request(URL_MAP.END_CLASH.method, url));

    expect(status).to.be.equal(200);
  }


  async _get_player(pid) {
    url = this.url(URL_MAP.GET_PLAYER.path(pid));
    ({ body, status } = await this.request(URL_MAP.GET_PLAYER.method, url));

    expect(status).to.be.equal(200);
    expect(body).to.be.valid.json;

    const obj = JSON.parse(body);
    return obj;
  }

  _to_currency(val) {
    return parseFloat(val).toFixed(2);
  }

  _add_usd(v1, v2) {
    return this._to_currency(parseFloat(v1) + parseFloat(v2));
  }

  _sub_usd(v1, v2) {
    return this._to_currency(parseFloat(v1) - parseFloat(v2));
  }
}


Fixture.assert_valid_clash = (obj) => {
  const fields = [
    'cid',
    'p1_id',
    'p1_name',
    'p1_points',
    'p2_id',
    'p2_name',
    'p2_points',
    'winner_pid',
    'is_active',
    'prize_usd',
    'age',
    'ends_at',
    'attendance'
  ];

  for (const field of fields) {
    expect(obj).to.have.property(field);
  }
}


Fixture.assert_valid_player = (obj) => {
  const fields = [
    'pid',
    'name',
    'handed',
    'is_active',
    'num_join',
    'num_won',
    'num_dq',
    'balance_usd',
    'total_points',
    'rank',
    'spec_count',
    'total_prize_usd',
    'efficiency'
  ];

  for (const field of fields) {
    expect(obj).to.have.property(field);
  }
}


Fixture.assert_valid_player_balance = (obj) => {
  const fields = [
    'old_balance_usd',
    'new_balance_usd'
  ];

  for (const field of fields) {
    expect(obj).to.have.property(field);
  }
}


module.exports = {
  Fixture
}


chai.use(function (chai) {
  var Assertion = chai.Assertion;

  Assertion.addMethod('model', function (exp) {
    const self = this;

    const validators = {
      clash:          Fixture.assert_valid_clash,
      player:         Fixture.assert_valid_player,
      player_balance: Fixture.assert_valid_player_balance
    }

    if (!(exp in validators)) {
      throw new Error(`invalid model assertion -- val:${exp}, allowed:${Object.keys(validators).join(',')}`);
    }

    validators[exp](self._obj);
  });
});
