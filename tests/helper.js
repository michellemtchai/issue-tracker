const chaiHttp = require('chai-http');
const chai = require('chai');
const server = require('../server');
chai.use(chaiHttp);

const addParamsToRoute = (route, params)=>{
  let keys = Object.keys(params);
  if(keys.length > 0){
    let query = keys.map(
      i=> `${i}=${decodeURIComponent(params[i])}`
    );
    return `${route}?${query.join('&')}`;
  }
  else{
    return route;
  }
}

const request = {
  get: (done, route, action, params = {})=>{
    chai.request(server)
    .get(addParamsToRoute(route, params))
    .end((err, res)=> {
      action(err, res);
      done();
    });
  },
  post: (done, route, action, params = {})=>{
    chai.request(server)
    .post(route)
    .send(params)
    .end((err, res) => {
      action(err, res);
      done();
    });
  },
  put: (done, route, action, params = {})=>{
    chai.request(server)
    .put(route)
    .send(params)
    .end((err, res) => {
      action(err, res);
      done();
    });
  },
  delete: (done, route, action, params = {})=>{
    chai.request(server)
    .delete(route)
    .send(params)
    .end((err, res) => {
      action(err, res);
      done();
    });
  }
};

module.exports = request;