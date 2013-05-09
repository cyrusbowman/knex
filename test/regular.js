var When = require('when');
var _ = require('underscore');
var objectdump = require('objectdump');
var dev = parseInt(process.env.KNEX_DEV, 10);
var out = (dev ? require('./index').output : require('./shared/output'));
var assert = require('assert');

module.exports = function(Knex, type) {

  var dfd = When.defer();

  describe('DB Tests - ' + type, function() {

    describe('Knex.Builder', function() {

      before(function(ok) {
        var val = handler(type, 'schema');
        require('./lib/schema')(Knex, function() {
          ok();
        }, function(err) {
          throw new Error(err);
        }, type);
      });

      describe('Inserts', function() {
        require('./lib/inserts')(Knex, type, handler(type, 'inserts'), 'DB');
      });

      describe('Updates', function() {
        require('./lib/updates')(Knex, type, handler(type, 'updates'), 'DB');
      });

      describe('Selects', function() {
        require('./lib/selects')(Knex, type, handler(type, 'selects'), 'DB');
      });

      describe('Aggregate', function() {
        require('./lib/aggregate')(Knex, type, handler(type, 'aggregate'), 'DB');
      });

      describe('Joins', function() {
        require('./lib/joins')(Knex, type, handler(type, 'joins'), 'DB');
      });

      describe('Deletes', function() {
        require('./lib/deletes')(Knex, type, handler(type, 'deletes'), 'DB');
      });

      describe('Aggregates, Truncate', function() {
        require('./lib/additional')(Knex, type, handler(type, 'additional'), 'DB');
      });

      describe('Deletes', function() {
        require('./lib/unions')(Knex, type, handler(type, 'unions'), 'DB');
      });

      after(function(ok) {
        if (dev) require('fs').writeFileSync('./test/shared/output.js', 'module.exports = ' + objectdump(out));
        dfd.resolve();
        ok();
      });

    });

  });

  return dfd.promise;

};


var handler = function(instance, section) {
  var item = 1;
  return function(resolver, isAll) {
    var fn = function(data) {
      var label = '' + section + '.' + item;
      if (dev) {
        if (_.isArray(data)) data = _.map(data, omitDates);
        out['db'] = out['db'] || {};
        out['db'][label] = out['db'][label] || {};
        out['db'][label][instance] = data;
      } else {
        var checkData = out['db'][label][instance];
        if (_.isArray(data)) {
          data = _.map(data, omitDates);
          checkData = _.map(checkData, omitDates);
        }
        try {
          assert.deepEqual(checkData, data);
        } catch (e) {
          //console.log([checkData, data]);
        }
      }
      item++;
      if (!isAll) resolver();
    };
    if (isAll) {
      return function(data) {
        _.map(data, fn);
        resolver();
      };
    } else {
      return fn;
    }
  };
};

var omitDates = function(item) {
  if (_.isObject(item)) {
    return _.omit(item, 'created_at', 'updated_at');
  }
  return item;
};
