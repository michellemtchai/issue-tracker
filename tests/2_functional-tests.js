const assert = require('chai').assert;
const request = require('./helper');
const route = '/api/issues/test-suite';
const successStatus = 200;
const errorStatus = 200;
const issue1 = { 
  issue_title: "title 1",
  issue_text: "issue text 1",
  created_by: "user 1",
  assigned_to: "user 2",
  open: false,
  status_text: "In QA"
};
const issue2 = {
  issue_title: "title 2",
  issue_text: "issue text 2",
  created_by: "user 1",
};
const emptyFunc = ()=>{};
const testModified = (done, method, params, step1, step2)=>{
  request[method](emptyFunc, route, (_, res)=>{
    step1(_, res);
    request.get(done, route, step2);
  }, params);
}
let issues = [];

suite('Functional Tests', () => {
  suiteSetup((done)=>{
    let deleteAll = (_, res)=>{
      let ids = res.body.map(i=>i._id);
      ids.forEach(id=>{
        request.delete(emptyFunc, route, emptyFunc, {
          _id: id
        })
      })
    }
    request.get(done, route, deleteAll);
  });

  suite('POST /api/issues/{project}', () => {
    test(
      'Create an issue with every field', (done)=>{
        let params = issue1;
        request.post(done, route, (_, res)=>{
          assert.equal(res.status, successStatus);
          assert.equal(res.type, 'application/json');
          Object.keys(params).forEach(key=>{
            assert.equal(res.body[key], params[key]);
          })
          issues.push(res.body);
        }, params);
    });

    test(
      'Create an issue with only required fields', (done)=>{
        let params = issue2;
        request.post(done, route, (_, res)=>{
          assert.equal(res.status, successStatus);
          assert.equal(res.type, 'application/json');
          Object.keys(params).forEach(key=>{
            assert.equal(res.body[key], params[key]);
          })
          assert.equal(res.body.assigned_to, '');
          assert.equal(res.body.status_text, '');
          assert.equal(res.body.open, true);
          issues.push(res.body);
        }, params);
    });

    test(
      'Create an issue with missing required fields', (done)=>{
        request.post(done, route, (_, res)=>{
          assert.equal(res.status, errorStatus);
          assert.equal(res.type, 'application/json');
          assert.deepEqual(res.body, {
            error: "required field(s) missing"
          })
        });
    });
   });

  suite('GET /api/issues/{project}', () => {
    test(
      'View issues on a project', (done)=>{
        request.get(done, route, (_, res)=>{
          assert.equal(res.status, successStatus);
          assert.equal(res.type, 'application/json');
          assert.equal(res.body.length, 2);
        });
    });

    test(
      'View issues on a project with one filter', (done)=>{
        let params = {
          open: issue1.open
        }
        request.get(done, route, (_, res)=>{
          assert.equal(res.status, successStatus);
          assert.equal(res.type, 'application/json');
          assert.equal(res.body.length, 1);
          Object.keys(params).forEach(key=>{
            assert.equal(res.body[0][key], params[key]);
          })
        }, params);
    });

    test(
      'View issues on a project with multiple filters', (done)=>{
        let params = issue2;
        request.get(done, route, (_, res)=>{
          assert.equal(res.status, successStatus);
          assert.equal(res.type, 'application/json');
          assert.equal(res.body.length, 1);
          Object.keys(params).forEach(key=>{
            assert.equal(res.body[0][key], params[key]);
          })
        }, params);
    });
  });

  suite('PUT /api/issues/{project}', () => {

    test(
      'Update one field on an issue', (done)=>{
        let params = {
          _id: issues[0]._id,
          assigned_to: 'john',
        }
        let step1 = (_, res)=>{
          assert.equal(res.status, successStatus);
          assert.equal(res.type, 'application/json');
          assert.deepEqual(res.body, {
            result: 'successfully updated',
            _id: params._id
          });
        }
        let step2 = (_, res)=>{
          assert.equal(res.status, successStatus);
          assert.equal(res.type, 'application/json');
          Object.keys(params).forEach(key=>{
            assert.equal(res.body[0][key], params[key]);
          })
        }
        testModified(done, 'put', params, step1, step2)
    });

    test(
      'Update multiple fields on an issue', (done)=>{
        let params = {
          _id: issues[1]._id,
          assigned_to: 'emily',
          issue_text: 'changed text',
          issue_title: 'changed title',
        }
        let step1 = (_, res)=>{
          assert.equal(res.status, successStatus);
          assert.equal(res.type, 'application/json');
          assert.deepEqual(res.body, {
            result: 'successfully updated',
            _id: params._id
          });
        }
        let step2 = (_, res)=>{
          assert.equal(res.status, successStatus);
          assert.equal(res.type, 'application/json');
          Object.keys(params).forEach(key=>{
            assert.equal(res.body[1][key], params[key]);
          })
        }
        testModified(done, 'put', params, step1, step2)
    });

    test(
      'Update an issue with missing _id', (done)=>{
        request.put(done, route, (_, res)=>{
          assert.equal(res.status, errorStatus);
          assert.equal(res.type, 'application/json');
          assert.deepEqual(res.body, {
            error: 'missing _id'
          })
        });
    });

    test(
      'Update an issue with no fields to update', (done)=>{
        let params = {
          _id: issues[0]._id
        }
        request.put(done, route, (_, res)=>{
          assert.equal(res.status, successStatus);
          assert.equal(res.type, 'application/json');
          assert.deepEqual(res.body, {
            error: 'no update field(s) sent',
            _id: params._id,
          })
        }, params);
    });

    test(
      'Update an issue with an invalid _id', (done)=>{
        let params = {
          _id: 'random',
          issue_title: 'changed title'
        }
        request.put(done, route, (_, res)=>{
          assert.equal(res.status, errorStatus);
          assert.equal(res.type, 'application/json');
          assert.deepEqual(res.body, {
            error: 'could not update',
            _id: params._id,
          })
        }, params);
    });
  });

  suite('DELETE /api/issues/{project}', () => {
    test(
      'Delete an issue', (done)=>{
        let params = {
          _id: issues[0]._id
        }
        request.delete(done, route, (_, res)=>{
          assert.equal(res.status, successStatus);
          assert.equal(res.type, 'application/json');
          assert.deepEqual(res.body, {
            result: 'successfully deleted',
            _id: params._id,
          })
        }, params);
    });

    test(
      'Delete an issue with an invalid _id', (done)=>{
        let params = {
          _id: 'random'
        }
        request.delete(done, route, (_, res)=>{
          assert.equal(res.status, errorStatus);
          assert.equal(res.type, 'application/json');
          assert.deepEqual(res.body, {
            error: 'could not delete',
            _id: params._id,
          })
        }, params);
    });

    test(
      'Delete an issue with missing _id', (done)=>{
        request.delete(done, route, (_, res)=>{
          assert.equal(res.status, errorStatus);
          assert.equal(res.type, 'application/json');
          assert.deepEqual(res.body, {
            error: 'missing _id'
          })
        });
    });
  });
});
