const { Op } = require('sequelize');
const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

const JSON_FIELDS = ['mindsetReport', 'psychometricScores', 'answers', 'formData', 'documents', 'pendingExams', 'issuedLetters', 'salaryBreakup', 'verificationChecks', 'tasks'];

function ensureParsed(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    for (const f of JSON_FIELDS) {
        if (obj[f] && typeof obj[f] === 'string' && (obj[f].startsWith('{') || obj[f].startsWith('['))) {
            try { obj[f] = JSON.parse(obj[f]); } catch(e) {}
        }
    }
    return obj;
}

function prepareForStorage(Model, data) {
    if (!data || typeof data !== 'object') return data;
    const prepared = { ...data };
    const attrs = Model.rawAttributes || {};
    for (const [k, v] of Object.entries(prepared)) {
        if (v !== null && typeof v === 'object' && !(v instanceof Date)) {
            const attr = attrs[k];
            // If the model attribute in Sequelize is TEXT/STRING or undefined (e.g., added via raw ALTER), serialize object to JSON string
            if (!attr || attr.type?.key === 'TEXT' || attr.type?.key === 'STRING') {
                prepared[k] = JSON.stringify(v);
            }
        }
    }
    return prepared;
}

// Helper to decorate instance with Mongoose methods
function wrapInstance(instance) {
    if (!instance || typeof instance !== 'object') return instance;
    ensureParsed(instance);
    if (instance.dataValues) ensureParsed(instance.dataValues);
    if (typeof instance.get === 'function') {
        const plain = ensureParsed(instance.get({ plain: true }));
        instance.markModified = (prop) => {
            instance.changed(prop, true);
        };
        instance.toObject = () => plain;
    }
    return instance;
}

// Helper query builder to support Mongoose chaining (.lean(), .sort(), .limit(), etc.)
function makeQueryBuilder(Model, query, isSingle = false) {
    let order = [];
    let limitVal = null;
    let skipVal = null;
    let isLean = false;
    let selectExcludes = [];

    const chain = {
        sort: function(sortObj) {
            if (sortObj && typeof sortObj === 'object') {
                for (const [k, v] of Object.entries(sortObj)) {
                    order.push([k, (v === 1 || v === 'asc' || v === 'ASC') ? 'ASC' : 'DESC']);
                }
            }
            return chain;
        },
        select: function(fields) { 
            if (fields && typeof fields === 'string') {
                selectExcludes = fields.split(' ').filter(f => f.startsWith('-')).map(f => f.substring(1));
            }
            return chain; 
        },
        limit: function(n) { limitVal = n; return chain; },
        skip: function(n) { skipVal = n; return chain; },
        lean: function() { isLean = true; return chain; },
        then: function(resolve, reject) {
            const opts = { where: buildWhere(query) };
            if (order.length > 0) opts.order = order;
            if (limitVal !== null) opts.limit = limitVal;
            if (skipVal !== null) opts.offset = skipVal;
            if (selectExcludes.length > 0) {
                // Ignore nested dot notation entirely (like 'documents.data') since Sequelize doesn't support it this way and documents is just metadata now
                const validExcludes = selectExcludes.filter(f => !f.includes('.'));
                if (validExcludes.length > 0) {
                    opts.attributes = { exclude: validExcludes };
                }
            }

            if (isSingle) {
                return Model.findOne(opts).then(inst => {
                    if (!inst) return null;
                    return isLean ? ensureParsed(inst.get({ plain: true })) : wrapInstance(inst);
                }).then(resolve, reject);
            } else {
                return Model.findAll(opts).then(list => {
                    return list.map(inst => isLean ? ensureParsed(inst.get({ plain: true })) : wrapInstance(inst));
                }).then(resolve, reject);
            }
        },
        catch: function(reject) {
            return chain.then(res => res, reject);
        }
    };
    return chain;
}

function makeFindByIdQuery(Model, id) {
    let isLean = false;
    const chain = {
        select: function() { return chain; },
        lean: function() { isLean = true; return chain; },
        then: function(resolve, reject) {
            return Model.findByPk(id).then(inst => {
                if (!inst) return null;
                return isLean ? inst.get({ plain: true }) : wrapInstance(inst);
            }).then(resolve, reject);
        },
        catch: function(reject) {
            return chain.then(res => res, reject);
        }
    };
    return chain;
}

// Helper to build Sequelize where clause from Mongoose query
function buildWhere(query) {
    if (!query || typeof query !== 'object') return {};
    const where = {};
    for (const [key, value] of Object.entries(query)) {
        if (key === '$or') {
            where[Op.or] = value.map(cond => buildWhere(cond));
            continue;
        }
        if (value === undefined) continue;
        if (key === '_id') {
            if (value && typeof value === 'object') {
                if (value.$in) where._id = { [Op.in]: value.$in };
                else if (value.$nin) where._id = { [Op.notIn]: value.$nin };
                else where._id = value;
            } else {
                where._id = value;
            }
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (value.$regex !== undefined) {
                let pattern = value.$regex;
                if (pattern instanceof RegExp) pattern = pattern.source;
                let isIgnoreCase = (value.$options && typeof value.$options === 'string' && value.$options.includes('i'));
                if (typeof pattern === 'string') {
                    let hasStart = pattern.startsWith('^');
                    let hasEnd = pattern.endsWith('$');
                    if (hasStart) pattern = pattern.slice(1);
                    if (hasEnd) pattern = pattern.slice(0, -1);
                    pattern = pattern.replace(/\\([.*+?^${}()|[\]\\])/g, '$1');
                    if (!hasStart) pattern = '%' + pattern;
                    if (!hasEnd) pattern = pattern + '%';
                }
                where[key] = isIgnoreCase ? { [Op.iLike]: pattern } : { [Op.like]: pattern };
            } else if (value.$gte !== undefined || value.$gt !== undefined || value.$lte !== undefined || value.$lt !== undefined) {
                where[key] = {};
                if (value.$gte !== undefined) where[key][Op.gte] = value.$gte;
                if (value.$gt !== undefined) where[key][Op.gt] = value.$gt;
                if (value.$lte !== undefined) where[key][Op.lte] = value.$lte;
                if (value.$lt !== undefined) where[key][Op.lt] = value.$lt;
            } else if (value.$in !== undefined) {
                where[key] = { [Op.in]: value.$in };
            } else if (value.$nin !== undefined) {
                where[key] = { [Op.notIn]: value.$nin };
            } else if (value.$exists !== undefined) {
                where[key] = value.$exists ? { [Op.not]: null } : null;
            } else {
                where[key] = value;
            }
        } else {
            where[key] = value;
        }
    }
    return where;
}

// Model Adapter Factory
function createModelAdapter(Model) {
    function Adapter(data = {}) {
        Object.assign(this, data);
        if (!this._id) this._id = generateId();
        this.save = async () => {
            const exists = await Model.findByPk(this._id);
            if (exists) {
                const id = (typeof exists.get === 'function' ? exists.get('_id') : null) || exists.dataValues?._id || exists._id || this._id;
                applyUpdate(exists, this);
                const plainData = typeof exists.get === 'function' ? exists.get({ plain: true }) : { ...exists };
                delete plainData._id;
                await Model.update(prepareForStorage(Model, plainData), { where: { _id: id } });
                return wrapInstance(await Model.findByPk(id));
            } else {
                const inst = await Model.create(prepareForStorage(Model, this));
                return wrapInstance(inst);
            }
        };
    }

    Adapter.findOne = (query) => makeQueryBuilder(Model, query, true);
    Adapter.find = (query = {}) => makeQueryBuilder(Model, query, false);
    Adapter.findById = (id) => makeFindByIdQuery(Model, id);
    Adapter.create = async (data) => {
        if (Array.isArray(data)) {
            data.forEach(d => { if (!d._id) d._id = generateId(); });
            const insts = await Model.bulkCreate(data.map(d => prepareForStorage(Model, d)));
            return insts.map(inst => wrapInstance(inst));
        } else {
            if (!data._id) data._id = generateId();
            const inst = await Model.create(prepareForStorage(Model, data));
            return wrapInstance(inst);
        }
    };
    Adapter.count = async (query = {}) => {
        return await Model.count({ where: buildWhere(query) });
    };
    Adapter.countDocuments = async (query = {}) => {
        return await Model.count({ where: buildWhere(query) });
    };
    Adapter.findOneAndUpdate = async (query, updateObj, options = {}) => {
        const inst = await Model.findOne({ where: buildWhere(query) });
        if (!inst) return null;
        const id = (typeof inst.get === 'function' ? inst.get('_id') : null) || inst.dataValues?._id || inst._id;
        applyUpdate(inst, updateObj);
        const plainData = typeof inst.get === 'function' ? inst.get({ plain: true }) : { ...inst };
        delete plainData._id;
        await Model.update(prepareForStorage(Model, plainData), { where: { _id: id } });
        return wrapInstance(await Model.findByPk(id));
    };
    Adapter.findByIdAndUpdate = async (id, updateObj, options = {}) => {
        const inst = await Model.findByPk(id);
        if (!inst) return null;
        applyUpdate(inst, updateObj);
        const plainData = typeof inst.get === 'function' ? inst.get({ plain: true }) : { ...inst };
        delete plainData._id;
        await Model.update(prepareForStorage(Model, plainData), { where: { _id: id } });
        return wrapInstance(await Model.findByPk(id));
    };
    Adapter.updateOne = async (query, updateObj) => {
        const inst = await Model.findOne({ where: buildWhere(query) });
        if (inst) {
            const id = (typeof inst.get === 'function' ? inst.get('_id') : null) || inst.dataValues?._id || inst._id;
            applyUpdate(inst, updateObj);
            const plainData = typeof inst.get === 'function' ? inst.get({ plain: true }) : { ...inst };
            delete plainData._id;
            await Model.update(prepareForStorage(Model, plainData), { where: { _id: id } });
        }
        return { acknowledged: true };
    };
    Adapter.updateMany = async (query, updateObj) => {
        const insts = await Model.findAll({ where: buildWhere(query) });
        let updatedCount = 0;
        for (const inst of insts) {
            const id = (typeof inst.get === 'function' ? inst.get('_id') : null) || inst.dataValues?._id || inst._id;
            applyUpdate(inst, updateObj);
            const plainData = typeof inst.get === 'function' ? inst.get({ plain: true }) : { ...inst };
            delete plainData._id;
            await Model.update(prepareForStorage(Model, plainData), { where: { _id: id } });
            updatedCount++;
        }
        return { acknowledged: true, modifiedCount: updatedCount };
    };
    Adapter.deleteOne = async (query) => {
        const count = await Model.destroy({ where: buildWhere(query), limit: 1 });
        return { deletedCount: count };
    };
    Adapter.deleteMany = async (query = {}) => {
        const count = await Model.destroy({ where: buildWhere(query) });
        return { deletedCount: count };
    };
    Adapter.findByIdAndDelete = async (id) => {
        const inst = await Model.findByPk(id);
        if (inst) await inst.destroy();
        return wrapInstance(inst);
    };
    Adapter.destroy = async (options) => {
        return await Model.destroy(options);
    };

    return Adapter;
}

function applyUpdate(instance, updateObj) {
    if (!updateObj) return;
    const data = updateObj.$set ? { ...updateObj.$set } : { ...updateObj };
    delete data.$set;
    delete data.$push;
    delete data.$pull;
    delete data._id; // Never mutate primary key

    for (const [key, val] of Object.entries(data)) {
        if (key.startsWith('$')) continue;
        if (key.includes('.')) {
            const parts = key.split('.');
            const topKey = parts[0];
            let obj = instance[topKey] ? (typeof instance[topKey] === 'object' ? { ...instance[topKey] } : {}) : {};
            let curr = obj;
            for (let i = 1; i < parts.length - 1; i++) {
                if (!curr[parts[i]] || typeof curr[parts[i]] !== 'object') curr[parts[i]] = {};
                curr = curr[parts[i]];
            }
            curr[parts[parts.length - 1]] = val;
            instance[topKey] = obj;
            if (typeof instance.changed === 'function') {
                instance.changed(topKey, true);
            }
        } else {
            instance[key] = val;
            if (typeof instance.changed === 'function') {
                instance.changed(key, true);
            }
        }
    }

    if (updateObj.$push) {
        for (const [key, val] of Object.entries(updateObj.$push)) {
            const arr = Array.isArray(instance[key]) ? [...instance[key]] : [];
            arr.push(val);
            instance[key] = arr;
            instance.changed(key, true);
        }
    }

    if (updateObj.$pull) {
        for (const [key, filter] of Object.entries(updateObj.$pull)) {
            const arr = Array.isArray(instance[key]) ? [...instance[key]] : [];
            if (typeof filter === 'object' && filter !== null) {
                const filterKey = Object.keys(filter)[0];
                const filterVal = filter[filterKey];
                instance[key] = arr.filter(item => item && item[filterKey] !== filterVal);
            } else {
                instance[key] = arr.filter(item => item !== filter);
            }
            instance.changed(key, true);
        }
    }
}

module.exports = { MongooseAdapter: createModelAdapter, wrapInstance, makeQueryBuilder };
