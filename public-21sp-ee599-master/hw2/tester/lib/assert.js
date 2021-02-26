'use strict';

const _ = require('lodash');
const chai = require('chai');


const isValidJson = p => {
  try {
    JSON.parse(p);
    return true;
  }
  catch (e) {
    return false;
  }
};


const isValid8601 = p => {
  return !!p.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+(Z|00:00)$/);
};


chai.use(function (chai) {
  const Assertion = chai.Assertion;

  Assertion.addProperty('valid');
});

// JSON helpers
// property:  .json, .equivalent
// chainable: .valid
chai.use(function (chai, utils) {
  const Assertion = chai.Assertion;

  Assertion.addProperty('json', function () {
    const self = this;
    const result = isValidJson(self._obj);

    self.assert(result === true, 'expected #{this} to be valid json');

    utils.flag(self, 'jsonObj', JSON.parse(self._obj));
  });

  Assertion.addMethod('equivalent', function (exp) {
    const self = this;    
    const jsonObj = utils.flag(self, 'jsonObj');

    self.assert(_.isEqual(jsonObj, exp), 'expected json #{act} to deep equal #{exp}', null, exp, jsonObj);
  });
});


// date helpers
chai.use(function (chai, utils) {
  var Assertion = chai.Assertion;

  Assertion.addProperty('iso8601', function () {
    const self = this;
    const result = isValid8601(self._obj);

    self.assert(result === true, 'expected #{this} to be valid ISO-8601 string');
  });
});
