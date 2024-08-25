const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;

module.exports = class Model {
    constructor(name, schema) {
        this.model = mongoose.model(
            `${process.env.APP_DB_PREFIX}-${name}`,
            new mongoose.Schema({
                ...schema,
                created_on: {
                    type: Date,
                    default: Date.now,
                },
                updated_on: {
                    type: Date,
                    default: Date.now,
                },
            })
        );
    }

    renderError = (res, message) => {
      if(typeof message === 'string'){
        res.json({
            message: message,
        });
      }
      else{
        res.json(message)
      }
    };

    find = (
        res,
        next,
        {
            query = {},
            sort = null,
            limit = null,
            select = null,
        } = {},
        error = null
    ) => {
        let model = this.model.find(query);
        if (sort) {
            model = model.sort(sort);
        }
        if (limit) {
            model = model.limit(limit);
        }
        if (select) {
            model = model.select(select);
        }
        handleDbAction(this, res, next, model, 'exec', error);
    };

    findById = (res, id, next, select = null, error = null) => {
        let handleResult = (data) => {
            handleOneRecordResult(this, res, data, id, next, error);
        };
        let model = this.model.findById(id);
        if (select) {
            model = model.select(select);
        }
        handleDbAction(this, res, handleResult, model, 'exec', error);
    };

    createOne = (res, params, next, select = null, error = null) => {
        let model = new this.model(params);
        let processData = next;
        if (select) {
            processData = (data) => {
                this.findById(res, data._id, next, {
                    select: select,
                });
            };
        }
        handleDbAction(this, res, processData, model, 'save', error);
    };

    createMany = (
        res,
        entries,
        next,
        { sort = null, select = null } = {},
        error = null
    ) => {
        let processData = next;
        if (sort || select) {
            processData = (data) => {
                let ids = data.map((entry) =>
                    ObjectId(entry._id)
                );
                this.find(res, next, {                  
                    query: {_id: {$in: ids}},
                    select: select,
                    sort: sort,
                });
            };
        }
        handleDbAction(
            this,
            res,
            processData,
            this.model,
            'create',
            error,
            [entries]
        );
    };

    update = (res, next, change, select = null, error = null) => {
        let changeAction = (data) => {
            return data.map((entry) => {
                entry = change(entry);
                entry.updated_on = new Date();
                return entry;
            });
        };
        let handleData = (data) => {
            handleDbAction(
                this,
                res,
                next,
                changeAction(data),
                'save',
                error
            );
        };
        this.find(res, handleData, {
            query: params,
        });
    };

    updateById = (res, id, params, next, select = null, error = null) => {
        params = {
          ...params,
          updated_on: new Date()
        }
        let handleResult = (data) => {
            handleOneRecordResult(this, res, data, id, next, error);
        };
        let processData = handleResult;
        if (select) {
            processData = (data) => {
                this.findById(res, data._id, handleResult, {
                    select: select,
                });
            };
        }
        handleDbAction(
            this,
            res,
            handleResult,
            this.model,
            'findByIdAndUpdate',
            error,
            [{ _id: id }, params]
        );
    };

    remove = (
        res,
        next,
        query,
        { sort = null, select = null } = {},
        error = null
    ) => {
        let model = this.model.deleteMany(query);
        if (sort) {
            model = model.sort(sort);
        }
        if (select) {
            model = model.select(select);
        }
        handleDbAction(this, res, next, model, 'exec', error);
    };

    removeById = (res, id, next, select = null, error = null) => {
        let handleResult = (data) => {
            handleOneRecordResult(this, res, data, id, next, error);
        };
        let model = this.model.findByIdAndRemove(id);
        if (select) {
            model = model.select(select);
        }
        handleDbAction(this, res, handleResult, model, 'exec', error);
    };
};

// private functions
const handleDbAction = (
    modelClass,
    res,
    next,
    model,
    fnName,
    error = null,
    params = []
) => {
    let t = timeOut(modelClass, res, error);
    try {
        model[fnName](...params, (err, data) => {
            clearTimeout(t);
            if (!err) {
                next(data);
            } else {
                modelClass.renderError(res, error ? error : err.message);
            }
        });
    } catch (err) {
        clearTimeout(t);
        modelClass.renderError(res, error ? error : err.message);
    }
};

const timeOut = (modelClass, res, error) => {
    let timeout = 10000;
    return setTimeout(() => {
        modelClass.renderError(
          res, 
          error ? error : 'Database Timeout'
        );
    }, timeout);
};

const handleOneRecordResult = (
    modelClass,
    res,
    data,
    id,
    next,
    error = null
) => {
    if (data) {
        next(data);
    } else {
        modelClass.renderError(
            res,
            error ? error : 
            `No record with the id "${id}"`
        );
    }
};
