/**
 * Plugin.js file, set configs, routes, hooks and events here
 *
 * see http://wejs.org/docs/we/plugin
 */

var elasticsearch = require('elasticsearch');

module.exports = function loadPlugin(projectPath, Plugin) {
  var plugin = new Plugin(__dirname);

  plugin.setConfigs({
    elasticsearch: {
      // index: 'wejs',
      // // connection configurations
      // connection: {
      //   host: 'localhost:9200',
      //   log: 'trace'
      // },
      // // models for crud in elastic search
      // models: {}
    }
  });

  plugin.hooks.on('we:models:set:joins', function (we, done) {
    if (!we.config.elasticsearch.connection) {
      we.log.warn('we-plugin-elasticsearch: connection configuration not found');
      return done();
    }
    // current connection is avaible in: we.plugins['we-pugin-elasticsearch'].connection
    plugin.connection = new elasticsearch.Client( we.config.elasticsearch.connection );

    for(var modelName in we.config.elasticsearch.models) {
      if (we.config.elasticsearch.models[modelName]) {
        plugin.addSolrFeaturesInModel(we, modelName);
      }
    }

    done();
  });

  plugin.addSolrFeaturesInModel = function addSolrFeaturesInModel(we, modelName) {
    var model = we.db.models[modelName];

    // model.addHook('afterFind', 'load', we.file.image.afterFind);
    model.addHook('afterCreate', 'registerInSolr', plugin.afterCreatedRecord.bind(
      { modelName: modelName }
    ));
    model.addHook('afterUpdate', 'updateInSolr', plugin.afterUpdatedRecord.bind(
      { modelName: modelName }
    ))
    model.addHook('afterDestroy', 'remoteFromSolr', plugin.afterDeleteRecord.bind(
      { modelName: modelName }
    ));
  };

  plugin.afterCreatedRecord = function afterCreatedRecord(record, opts, done) {
    if (!record) return done();

    plugin.connection.create({
      index: plugin.we.config.elasticsearch.index,
      type: this.modelName,
      id: record.id,
      body: record.get()
    }, function afterRegiserRecordInES(error) {
      if (error) {
        plugin.we.log.error(error);
      } else {
        plugin.we.log.verbose('we-plugin-elasticsearch: add record ' + opts.model + record.id);
      }

      done();
    });
  }

  plugin.afterUpdatedRecord = function afterUpdatedRecord(record, opts, done) {
    if (!record) return done();

    var data = {};

    for (var i = 0; i < opts.fields.length; i++) {
      data[opts.fields[i]] = record.getDataValue(opts.fields[i]);
    }

    plugin.connection.update({
      index: plugin.we.config.elasticsearch.index,
      type: this.modelName,
      id: record.id,
      body: {
        doc: data
      }
    }, function (error) {
      if (error) {
        plugin.we.log.error(error);
      } else {
        plugin.we.log.verbose('we-plugin-elasticsearch: update record ' + opts.model + record.id);
      }

      done();
    });

  }

  plugin.afterDeleteRecord = function afterDeleteRecord(record, opts, done) {
    if (!record) return done();

    plugin.connection.delete({
      index: plugin.we.config.elasticsearch.index,
      type: this.modelName,
      id: record.id
    }, function (error) {
      if (error) {
        plugin.we.log.error(error);
      } else {
        plugin.we.log.verbose('we-plugin-elasticsearch: delete record ' + opts.model + record.id);
      }

      done();
    });
  }

  return plugin;
};