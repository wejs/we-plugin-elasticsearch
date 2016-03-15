var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var http, we, agent, solr;
var Chancejs = require('chance');
// Instantiate Chance so it can be used
var chancejs = new Chancejs();

function articleStub(creatorId) {
  return {
    creatorId: creatorId,
    published: true,
    title: chancejs.sentence({words: 4}),
    about: chancejs.paragraph({sentences: 1}),
    body:  chancejs.paragraph({sentences: 5}),
  }
}

describe('we-plugin-elasticsearchFeature', function() {
  var salvedUser, salvedUserPassword, authenticatedRequest;

  before(function (done) {
    http = helpers.getHttp();
    agent = request.agent(http);

    we = helpers.getWe();

    solr = we.plugins['project'].connection;

    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, user) {
      if (err) throw err;

      salvedUser = user;
      salvedUserPassword = userStub.password;

      // login user and save the browser
      authenticatedRequest = request.agent(http);
      authenticatedRequest.post('/login')
      .set('Accept', 'application/json')
      .send({
        email: salvedUser.email,
        password: salvedUserPassword
      })
      .expect(200)
      .set('Accept', 'application/json')
      .end(function (err) {
        done(err);
      });
    })
  });

  describe('API', function () {
    it ('should register one record in elasticsearch after create record', function (done) {

      we.db.models.article.create(articleStub(salvedUser.id))
      .then(function (r) {

        solr.get({
          index: we.config.elasticsearch.index,
          type: 'article',
          id: r.id
        }, function (error, response) {
          if (error) throw error;

          assert(response._source);

          assert.equal(r.id, response._source.id);
          assert.equal(r.title, response._source.title);
          assert.equal(r.about, response._source.about);
          assert.equal(r.body, response._source.body);

          done();
        });
      }).catch(done);

    });

    it ('should update one record in elasticsearch after update record', function (done) {

      we.db.models.article.create(articleStub(salvedUser.id))
      .then(function (r) {
        assert(r);

        var newBody = chancejs.paragraph({sentences: 5});
        var newTitle = chancejs.paragraph({words: 4});

        r.updateAttributes({
          title: newTitle,
          body: newBody
        }).then(function (r) {

          solr.get({
            index: we.config.elasticsearch.index,
            type: 'article',
            id: r.id
          }, function (error, response) {
            if (error) throw error;

            assert(response._source);

            assert.equal(r.id, response._source.id);
            assert.equal(response._source.title, newTitle);
            assert.equal(r.about, response._source.about);
            assert.equal(response._source.body, newBody);

            done();
          });

        }).catch(done);

      });
    });

    it ('should delete one record in elasticsearch after delete record', function (done) {

      we.db.models.article.create(articleStub(salvedUser.id))
      .then(function (r) {
        assert(r);

        r.destroy().then(function () {
          solr.get({
            index: we.config.elasticsearch.index,
            type: 'article',
            id: r.id,
            ignore: [404]
          }, function (error, response) {
            if (error) throw error;

            assert(response);
            assert(!response.found);

            done();
          });

        }).catch(done);

      });
    });

  });
});