'use strict';

const { expect } = require('chai');

const DEFAULT_TIMEOUT_MS = 4e3;
const { Fixture } = require('../lib/fixture');


describe('GET /ping', function() {
  const DEFAULT_PATH   = '/ping';
  const DEFAULT_METHOD = 'get';

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());

  it('response code is 204', async function () {
    const url = fix.url(DEFAULT_PATH);
    const { body, status } = await fix.request(DEFAULT_METHOD, url);

    expect(status).to.be.equal(204);
    expect(body).to.be.equal('');
  });
});


describe('POST /admin/pre', function() {
  const DEFAULT_PATH   = '/admin/pre';
  const DEFAULT_METHOD = 'post';

  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());

  it('response code is 204', async function () {
    const url = fix.url(DEFAULT_PATH);
    const { body, status } = await fix.request(DEFAULT_METHOD, url);

    expect(status).to.be.equal(200);
    expect(body).to.be.equal('OK');
  });
});


describe('other', function() {
  this.timeout(DEFAULT_TIMEOUT_MS);

  const fix = new Fixture();

  before(() => fix.before());
  after(() => fix.after());

  it('response code 404 GET unknown path', function () {
    const paths = [
      '/',
      '/dummy',
      '/dummy/path'
    ];

    return Promise.map(paths, async path => {
      const url = fix.url(path);
      const { status } = await fix.request('GET', url);

      expect(status).to.be.equal(404);
    });
  });

  it('response code 404 POST unknown path', function () {
    const paths = [
      '/',
      '/dummy',
      '/dummy/path'
    ];

    return Promise.map(paths, async path => {
      const url = fix.url(path);
      const { status } = await fix.request('POST', url);

      expect(status).to.be.equal(404);
    });
  });
});
