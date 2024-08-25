'use strict';
const Model = require('./model');
module.exports = new Model('issue', {
  project_name: {
    type: String,
    required: true,
  },
  issue_title: {
    type: String,
    required: true
  },
  issue_text: {
    type: String,
    required: true
  },
  created_by: {
    type: String,
    required: true
  },
  assigned_to: {
    type: String,
    default: '',
  },
  open: {
    type: Boolean,
    default: true,
  },
  status_text: {
    type: String,
    default: '',
  },
});
