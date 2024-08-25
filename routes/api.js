'use strict';
const Issue = require('../models/issue');
const createRequired = ['issue_title', 'issue_text', 'created_by'];
const updateRequired = ['issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text', 'open'];
const permittedParams = ['project_name', ...updateRequired];

const issuesController = {
  index: (req,res)=>{
    let project = req.params.project;
    let params = getParams(project, req.query);
    let next = i=>res.json(i);
    Issue.find(res, next,{
      query: removeEmptyParams(params),
      select: selectRes
    })
  },
  create: (req,res)=>{
    let project = req.params.project;
    let params = getParams(project, req.body);
    let next = i=>res.json(i);
    if(containsRequired(params, createRequired)){
      Issue.createOne(
        res, 
        removeEmptyParams(params), 
        next, 
        selectRes
      )
    }
    else{
      renderError(res, {
        error: 'required field(s) missing'
      })
    }
  },
  update: (req,res)=>{
    let project = req.params.project;
    let params = getParams(project, req.body);
    let next = i=>{
      res.json({
        result: 'successfully updated',
        _id: i._id
      })
    };
    checkId(req, res, ()=>{
      let id = req.body._id;
      let errorMsg = {
        _id: id,
        error: "could not update"
      };
      if(containsOneOf(params, updateRequired)){
        Issue.updateById(
          res, 
          id, 
          removeEmptyParams(params), 
          next, 
          selectRes,
          errorMsg
        )
      }
      else{
        renderError(res, {
          error: 'no update field(s) sent', 
          _id: id
        });
      }
    });
  },
  delete: (req,res)=>{
    let project = req.params.project;
    let id = req.body._id;
    let errorMsg = {
      _id: id,
      error: "could not delete"
    };
    let next = i=>res.json({
      result: 'successfully deleted',
      _id: i._id
    });
    checkId(req, res, ()=>{
      Issue.removeById(res, id, next, {}, errorMsg)
    });
  }
}

// helper functions
const nonEmptyString = (value)=>{
  return typeof value === 'string' && value.length > 0;
}
const isBoolean = (value)=>{
  return typeof value === 'boolean';
}
const containsRequired = (params, required)=>{
  let paramKeys = Object.keys(params);
  for(let i=0; i< required.length; i++){
    let key = required[i];
    if(paramKeys.includes(key)){
      if(!nonEmptyString(key)){
        return false;
      }
    }
    else{
      return false;
    }
  }
  return true;
}
const containsOneOf = (params, required)=>{
  let paramKeys = Object.keys(params);
  for(let i=0; i< required.length; i++){
    let key = required[i];
    if(paramKeys.includes(key)){
      if(isBoolean(key) || nonEmptyString(key)){
        return true;
      }
    }
  }
  return false;
}
const checkId = (req, res, action)=>{
  let id = req.body._id;
  if(nonEmptyString(id)){
    action();
  }
  else{
    renderError(res, {
      error: 'missing _id'
    });
  }
}
const renderError = (res, error)=>{
  res.json(error);
}
const getParams = (project, params)=>{
  return {
    ...params,
    project_name: project
  }
}
const removeEmptyParams = (params)=>{
  let keys = Object.keys(params);
  let modParams = {};
  keys.forEach(key=>{
    let value = params[key];
    if(permittedParams.includes(key) && 
      (isBoolean(value) || nonEmptyString(value))
    ){
      modParams[key] = value;
    }
  })
  return modParams;
}
const selectRes ={
  project_name: 0,
  __v: 0
}

module.exports = function (app) {
  app.route('/api/issues/:project')  
    .get(issuesController.index)    
    .post(issuesController.create)   
    .put(issuesController.update)    
    .delete(issuesController.delete);
};
