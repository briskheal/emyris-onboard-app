const { Sequelize, DataTypes, Op } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'sqlite:./onboarding_fallback.sqlite';
const isRemoteSslDb = dbUrl.includes('sslmode=require') || dbUrl.includes('.neon.tech') || dbUrl.includes('.amazonaws.com') || dbUrl.includes('.render.com');

const sequelize = new Sequelize(dbUrl, {
    dialect: dbUrl.startsWith('sqlite') ? 'sqlite' : 'postgres',
    logging: false,
    dialectOptions: isRemoteSslDb ? {
        ssl: { rejectUnauthorized: false }
    } : {}
});

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

// 1. Company Model
const OnboardCompany = sequelize.define('onboard_company', {
    _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
    name: { type: DataTypes.STRING, defaultValue: "" },
    address: DataTypes.TEXT,
    phone: DataTypes.STRING,
    tollFree: DataTypes.STRING,
    website: DataTypes.STRING,
    email: DataTypes.STRING,
    activeLogoId: DataTypes.STRING,
    activeStampId: DataTypes.STRING,
    activeSignatureId: DataTypes.STRING,
    activeLetterheadId: DataTypes.STRING,
    signatoryName: DataTypes.STRING,
    signatoryDesignation: DataTypes.STRING,
    offerLetterBody: { type: DataTypes.TEXT, defaultValue: `{{REF_NO}}\nDate: {{TODAY_DATE}}\n\nTo,\n{{TITLE_SHORT}} {{FULL_NAME}}\n{{ADDRESS}}\n{{CITY_STATE}} - {{PIN}}\n\nSubject: Offer of Employment\n\nDear {{TITLE_SHORT}} {{FULL_NAME}},\n\nWith reference to your application and subsequent interview you had with us, we are pleased to appoint you as {{DESIGNATION}} in our organization {{COMPANY_NAME}} on the following terms and conditions:\n\n1. DATE OF JOINING: Your date of joining will be {{JOINING_DATE}}.\n\n2. HEADQUARTER: Your headquarter will be {{HQ}}.\n\n3. REPORTING: You will report to {{REPORTING_TO}} or anyone else as decided by the management.\n\n4. REMUNERATION: Your monthly gross salary will be Rs. {{SALARY_MONTHLY}}/- totaling an Annual CTC of Rs. {{SALARY_ANNUAL}}/- ({{SALARY_WORDS}}).\n\nWe look forward to a long and mutually beneficial association.\n\nBest Regards,\n\n{{SIGNATORY_NAME}}\n{{SIGNATORY_DESG}}\n{{COMPANY_NAME}}` },
    apptLetterBody: DataTypes.TEXT,
    confirmLetterBody: DataTypes.TEXT,
    emyfeLetterBody: DataTypes.TEXT,
    emyhoLetterBody: DataTypes.TEXT,
    emyhrLetterBody: DataTypes.TEXT,
    revisedSalaryBody: { type: DataTypes.TEXT, defaultValue: `{{REF_NO}}\nDate: {{TODAY_DATE}}\n\nTo,\n{{TITLE_SHORT}} {{FULL_NAME}}\n{{ADDRESS}}\n{{CITY_STATE}} - {{PIN}}\n\nSubject: REVISED SALARY LETTER\n\nDear {{TITLE_SHORT}} {{FULL_NAME}},\n\nPursuant to your performance review, your revised gross monthly CTC is Rs. {{SALARY_MONTHLY}}/- totaling an Annual CTC of Rs. {{SALARY_ANNUAL}}/- ({{SALARY_WORDS}}), effective from {{TODAY_DATE}}.\n\n{{SALARY_REVISION_BOX}}\n\n{{SALARY_BREAKUP}}\n\nWe look forward to your continued contribution to the organization.\n\nBest Regards,\n\n{{SIGNATORY_NAME}}\n{{SIGNATORY_DESG}}\n{{COMPANY_NAME}}` },
    incentiveCircularBody: DataTypes.TEXT,
    experienceLetterBody: DataTypes.TEXT,
    relievingLetterBody: DataTypes.TEXT,
    showCauseLetterBody: DataTypes.TEXT,
    miscLetters: { type: DataTypes.JSON, defaultValue: [] },
    templateSettings: { type: DataTypes.JSON, defaultValue: {} },
    fyFrom: DataTypes.STRING,
    fyTo: DataTypes.STRING,
    letterFontSize: { type: DataTypes.INTEGER, defaultValue: 11 },
    letterFontType: { type: DataTypes.STRING, defaultValue: 'helvetica' },
    letterAlignment: { type: DataTypes.STRING, defaultValue: 'left' },
    headerHeight: { type: DataTypes.INTEGER, defaultValue: 65 },
    footerHeight: { type: DataTypes.INTEGER, defaultValue: 25 },
    marqueeText: { type: DataTypes.STRING, defaultValue: "Enhancing Life and Excelling in Care" },
    marqueeColor: { type: DataTypes.STRING, defaultValue: "#94a3b8" },
    marqueeSpeed: { type: DataTypes.INTEGER, defaultValue: 20 },
    offerCounter: { type: DataTypes.INTEGER, defaultValue: 0 },
    apptCounter: { type: DataTypes.INTEGER, defaultValue: 0 },
    miscCounter: { type: DataTypes.INTEGER, defaultValue: 0 },
    empCodeCounter: { type: DataTypes.INTEGER, defaultValue: 0 },
    revisedSalaryCounter: { type: DataTypes.INTEGER, defaultValue: 0 },
    activeExamDate: { type: DataTypes.STRING, defaultValue: "" },
    customAssetCategories: { type: DataTypes.JSON, defaultValue: [] },
    designations: { 
        type: DataTypes.JSON, 
        defaultValue: [
            { title: "Territory Business Manager", department: "SALES" },
            { title: "Area Sales Manager", department: "SALES" },
            { title: "Regional Sales Manager", department: "SALES" },
            { title: "Sr. Regional Sales Manager", department: "SALES" },
            { title: "Zonal Sales Manager", department: "SALES" },
            { title: "Sr. Zonal Sales Manager", department: "SALES" },
            { title: "Sales Manager", department: "SALES" },
            { title: "National Sales Manager", department: "SALES" },
            { title: "General Manager (Sales & Mktng)", department: "SALES" }
        ] 
    },
    requiredDocs: {
        type: DataTypes.JSON, defaultValue: [
            "Aadhar Card - Front",
            "Aadhar Card - Back",
            "PAN Card",
            "Degree/Provisional Certificate",
            "Experience Letter - Previous Company",
            "Relieving Letter - Previous Company",
            "Last Month Salary Slip",
            "Digital Signature"
        ]
    }
});

// 2. Asset Model
const OnboardAsset = sequelize.define('onboard_asset', {
    _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
    category: DataTypes.STRING,
    name: DataTypes.STRING,
    data: DataTypes.TEXT,
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    uploadedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

// 3. Applicant Model
const OnboardApplicant = sequelize.define('onboard_applicant', {
    _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    title: { type: DataTypes.STRING, defaultValue: "Mr." },
    fullName: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'draft' },
    canLogin: { type: DataTypes.BOOLEAN, defaultValue: true },
    formData: { type: DataTypes.JSON, defaultValue: {} },
    registeredAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    submittedAt: DataTypes.DATE,
    approvedAt: DataTypes.DATE,
    documents: { type: DataTypes.JSON, defaultValue: [] },
    designation: DataTypes.STRING,
    division: DataTypes.STRING,
    reportingTo: DataTypes.STRING,
    hq: DataTypes.STRING,
    salary: DataTypes.STRING,
    dob: DataTypes.STRING,
    address: DataTypes.TEXT,
    pin: DataTypes.STRING,
    state: DataTypes.STRING,
    empCode: DataTypes.STRING,
    refNo: DataTypes.STRING,
    salaryBreakup: { type: DataTypes.JSON, defaultValue: {} },
    actualJoiningDate: DataTypes.STRING,
    maritalStatus: DataTypes.STRING,
    anniversaryDate: DataTypes.STRING,
    epfNumber: DataTypes.STRING,
    uanNumber: DataTypes.STRING,
    esiNumber: DataTypes.STRING,
    offerAccepted: { type: DataTypes.BOOLEAN, defaultValue: false },
    offerAcceptedAt: DataTypes.DATE,
    offerLetterData: DataTypes.TEXT,
    apptLetterData: DataTypes.TEXT,
    issuedLetters: { type: DataTypes.JSON, defaultValue: [] },
    probationReminderSent: { type: DataTypes.BOOLEAN, defaultValue: false },
    tasks: {
        type: DataTypes.JSON,
        defaultValue: {
            offerLetter: false,
            appointmentLetter: false,
            appLinkSent: false,
            loginDetailsSent: false
        }
    },
    verificationChecks: { type: DataTypes.JSON, defaultValue: {} },
    rejectionReason: DataTypes.TEXT,
    rejectedAt: DataTypes.DATE,
    isExistingStaff: { type: DataTypes.BOOLEAN, defaultValue: false },
    rapidTestScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    rapidTestCompleted: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// 4. Division Model
const OnboardDivision = sequelize.define('onboard_division', {
    _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

// 5. HQ Model
const OnboardHQ = sequelize.define('onboard_hq', {
    _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    active: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// 6. TemplateHistory Model
const OnboardTemplateHistory = sequelize.define('onboard_template_history', {
    _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
    type: DataTypes.STRING,
    content: DataTypes.TEXT,
    savedBy: DataTypes.STRING,
    savedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    version: DataTypes.INTEGER
});

// 7. Question Model (For Rapid Test)
const OnboardQuestion = sequelize.define('onboard_question', {
    _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
    category: { type: DataTypes.STRING, allowNull: false },
    questionType: { type: DataTypes.STRING, defaultValue: 'mcq' },
    text: { type: DataTypes.TEXT, allowNull: false },
    options: { type: DataTypes.JSON, defaultValue: [] },
    inputFields: { type: DataTypes.JSON, defaultValue: [] },
    correctAnswerIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// 8. Exam Result Model
const OnboardExamResult = sequelize.define('onboard_exam_result', {
    _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
    email: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING },
    hq: { type: DataTypes.STRING },
    division: { type: DataTypes.STRING },
    examDate: { type: DataTypes.STRING, allowNull: false },
    totalQuestions: { type: DataTypes.INTEGER, defaultValue: 0 },
    autoScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    manualScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: 'pending_review' },
    answers: { type: DataTypes.JSON, defaultValue: {} },
    submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

// Helper to decorate instance with Mongoose methods
function wrapInstance(instance) {
    if (!instance || typeof instance !== 'object') return instance;
    if (typeof instance.get === 'function') {
        const plain = instance.get({ plain: true });
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
                    return isLean ? inst.get({ plain: true }) : wrapInstance(inst);
                }).then(resolve, reject);
            } else {
                return Model.findAll(opts).then(list => {
                    return list.map(inst => isLean ? inst.get({ plain: true }) : wrapInstance(inst));
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
                await Model.update(plainData, { where: { _id: id } });
                return wrapInstance(await Model.findByPk(id));
            } else {
                const inst = await Model.create(this);
                return wrapInstance(inst);
            }
        };
    }

    Adapter.findOne = (query) => makeQueryBuilder(Model, query, true);
    Adapter.find = (query = {}) => makeQueryBuilder(Model, query, false);
    Adapter.findById = (id) => makeFindByIdQuery(Model, id);
    Adapter.create = async (data) => {
        if (!data._id) data._id = generateId();
        const inst = await Model.create(data);
        return wrapInstance(inst);
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
        await Model.update(plainData, { where: { _id: id } });
        return wrapInstance(await Model.findByPk(id));
    };
    Adapter.findByIdAndUpdate = async (id, updateObj, options = {}) => {
        const inst = await Model.findByPk(id);
        if (!inst) return null;
        applyUpdate(inst, updateObj);
        const plainData = typeof inst.get === 'function' ? inst.get({ plain: true }) : { ...inst };
        delete plainData._id;
        await Model.update(plainData, { where: { _id: id } });
        return wrapInstance(await Model.findByPk(id));
    };
    Adapter.updateOne = async (query, updateObj) => {
        const inst = await Model.findOne({ where: buildWhere(query) });
        if (inst) {
            const id = (typeof inst.get === 'function' ? inst.get('_id') : null) || inst.dataValues?._id || inst._id;
            applyUpdate(inst, updateObj);
            const plainData = typeof inst.get === 'function' ? inst.get({ plain: true }) : { ...inst };
            delete plainData._id;
            await Model.update(plainData, { where: { _id: id } });
        }
        return { acknowledged: true };
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

const Company = createModelAdapter(OnboardCompany);
const Applicant = createModelAdapter(OnboardApplicant);
const Division = createModelAdapter(OnboardDivision);
const HQ = createModelAdapter(OnboardHQ);
const Asset = createModelAdapter(OnboardAsset);
const TemplateHistory = createModelAdapter(OnboardTemplateHistory);
const Question = createModelAdapter(OnboardQuestion);
const ExamResult = createModelAdapter(OnboardExamResult);

async function syncDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to Shared PostgreSQL Database via Sequelize.');
        await sequelize.sync({ alter: true });
        console.log('✅ Synchronized onboard_* tables in database.');
        
        // Seed Questions (Inserts any missing questions to ensure rich permutation/combination)
        try {
            console.log('🌱 Checking and seeding Rapid Test question bank...');
            const seedQuestions = [
                // Math (Original + 13 New)
                { category: 'math', text: 'What is 15% of 200?', options: ['20', '30', '40', '50'], correctAnswerIndex: 1 },
                { category: 'math', text: 'If a train travels 60 miles in 1.5 hours, what is its average speed in mph?', options: ['30', '40', '45', '50'], correctAnswerIndex: 1 },
                { category: 'math', text: 'Solve for x: 3x + 12 = 27', options: ['3', '4', '5', '6'], correctAnswerIndex: 2 },
                { category: 'math', text: 'What is the square root of 144?', options: ['10', '12', '14', '16'], correctAnswerIndex: 1 },
                { category: 'math', text: 'A shirt costs $40. It is on sale for 25% off. What is the sale price?', options: ['$25', '$30', '$32', '$35'], correctAnswerIndex: 1 },
                { category: 'math', text: 'What is the next number in the sequence: 2, 6, 12, 20, __?', options: ['28', '30', '32', '36'], correctAnswerIndex: 1 },
                { category: 'math', text: 'Evaluate: (8 + 4) * 2 / 4', options: ['4', '6', '8', '12'], correctAnswerIndex: 1 },
                { category: 'math', text: 'How many degrees are in a right angle?', options: ['45', '90', '180', '360'], correctAnswerIndex: 1 },
                { category: 'math', text: 'What is 20% of 450?', options: ['80', '90', '100', '110'], correctAnswerIndex: 1 },
                { category: 'math', text: 'If 5 workers can build a wall in 10 days, how many days will it take 10 workers?', options: ['3', '5', '7', '10'], correctAnswerIndex: 1 },
                { category: 'math', text: 'What is the value of 3^4?', options: ['27', '64', '81', '243'], correctAnswerIndex: 2 },
                { category: 'math', text: 'If a rectangle has length 12cm and width 8cm, what is its perimeter?', options: ['20cm', '32cm', '40cm', '96cm'], correctAnswerIndex: 2 },
                { category: 'math', text: 'A car consumes 8 liters of fuel per 100 km. How much fuel is needed for a 250 km trip?', options: ['15L', '18L', '20L', '22L'], correctAnswerIndex: 2 },
                { category: 'math', text: 'What is the average of 14, 22, 28, and 36?', options: ['23', '25', '26', '28'], correctAnswerIndex: 1 },
                { category: 'math', text: 'If 4x - 8 = 16, what is x?', options: ['4', '5', '6', '8'], correctAnswerIndex: 2 },
                { category: 'math', text: 'What is the probability of rolling an even number on a standard 6-sided die?', options: ['1/6', '1/3', '1/2', '2/3'], correctAnswerIndex: 2 },
                { category: 'math', text: 'What is the simple interest on $1,000 at 5% per annum for 3 years?', options: ['$100', '$150', '$200', '$250'], correctAnswerIndex: 1 },
                { category: 'math', text: 'Which of the following is a prime number?', options: ['21', '33', '37', '49'], correctAnswerIndex: 2 },
                { category: 'math', text: 'If a circle has a radius of 7cm, what is its circumference approximately? (Use pi = 22/7)', options: ['22cm', '44cm', '66cm', '88cm'], correctAnswerIndex: 1 },
                { category: 'math', text: 'A product originally priced at $200 is discounted by 15%, then taxed by 10%. What is the final price?', options: ['$185', '$187', '$190', '$195'], correctAnswerIndex: 1 },
                { category: 'math', text: 'What is the next number in the series: 3, 9, 27, 81, __?', options: ['162', '243', '324', '729'], correctAnswerIndex: 1 },
                
                
                // Emystein Specific Questions
                { category: 'emystein', text: 'Who will be the focused doctor for Emystein 3miu?', questionType: 'mcq', options: ['GP', 'Dentist', 'Intensivist', 'Gynaecologist'], correctAnswerIndex: 2 },

                { category: 'emystein', text: 'What is the active molecule in Emystein?', questionType: 'mcq', options: ['Amoxicillin', 'Colistimethate Sodium', 'Ceftriaxone', 'Meropenem'], correctAnswerIndex: 1 },
                { category: 'emystein', text: 'What is the primary indication for Emystein 3miu?', questionType: 'mcq', options: ['Viral Infections', 'Fungal Infections', 'Multi-drug resistant Gram-negative infections', 'Parasitic Infections'], correctAnswerIndex: 2 },
                { category: 'emystein', text: 'How is Emystein 3miu typically administered?', questionType: 'mcq', options: ['Oral tablet', 'Intravenous or Intramuscular injection', 'Topical cream', 'Subcutaneous injection'], correctAnswerIndex: 1 },
                { category: 'emystein', text: 'Which of the following is a known potential side effect of colistimethate sodium?', questionType: 'mcq', options: ['Nephrotoxicity', 'Hepatotoxicity', 'Cardiotoxicity', 'Retinopathy'], correctAnswerIndex: 0 },
                { category: 'emystein', text: 'In which setting is Emystein most commonly prescribed?', questionType: 'mcq', options: ['Outpatient Clinics', 'Intensive Care Units (ICUs)', 'Dental Clinics', 'Dermatology Clinics'], correctAnswerIndex: 1 },
                { category: 'emystein', text: 'Emystein belongs to which class of antibiotics?', questionType: 'mcq', options: ['Penicillins', 'Cephalosporins', 'Polymyxins', 'Macrolides'], correctAnswerIndex: 2 },
                { category: 'emystein', text: 'Which pathogen is Emystein particularly effective against?', questionType: 'mcq', options: ['Staphylococcus aureus', 'Streptococcus pneumoniae', 'Pseudomonas aeruginosa', 'Candida albicans'], correctAnswerIndex: 2 },
                { category: 'emystein', text: 'What is the standard dosage unit for Emystein?', questionType: 'mcq', options: ['Milligrams (mg)', 'Grams (g)', 'Million International Units (MIU)', 'Micrograms (mcg)'], correctAnswerIndex: 2 },
                { category: 'emystein', text: 'When should the dosage of Emystein be adjusted?', questionType: 'mcq', options: ['In patients with renal impairment', 'In patients with hepatic impairment', 'In patients with hypertension', 'In pregnant patients only'], correctAnswerIndex: 0 },

                { category: 'emystein', text: 'What is the MRP of the product?', questionType: 'descriptive', inputFields: [] },
                { category: 'emystein', text: 'Write 4 competitors brand names.', questionType: 'descriptive', inputFields: ['Space 1', 'Space 2', 'Space 3', 'Space 4'] },
                { category: 'emystein', text: 'Write 3 major consuming hospitals in your HQ.', questionType: 'descriptive', inputFields: ['Space 1', 'Space 2', 'Space 3'] },
                { category: 'emystein', text: 'Write maximum used by 3 Doctors name.', questionType: 'descriptive', inputFields: ['Space 1', 'Space 2', 'Space 3'] },
                { category: 'emystein', text: 'What was last month Secondary units?', questionType: 'descriptive', inputFields: [] },
                { category: 'emystein', text: 'What was last month Primary units?', questionType: 'descriptive', inputFields: [] },
                { category: 'emystein', text: 'How to improve sales? Your suggestions.', questionType: 'descriptive', inputFields: [] },

                // English (Original + 13 New)
                { category: 'english', text: 'Which word is a synonym for "Abundant"?', options: ['Scarce', 'Plentiful', 'Empty', 'Brief'], correctAnswerIndex: 1 },
                { category: 'english', text: 'Identify the verb in the following sentence: "The quick brown fox jumps over the lazy dog."', options: ['quick', 'brown', 'jumps', 'lazy'], correctAnswerIndex: 2 },
                { category: 'english', text: 'Choose the correct spelling:', options: ['Accomodate', 'Accommodate', 'Acommodate', 'Acomodate'], correctAnswerIndex: 1 },
                { category: 'english', text: 'What is the antonym of "Expand"?', options: ['Grow', 'Increase', 'Shrink', 'Extend'], correctAnswerIndex: 2 },
                { category: 'english', text: 'Which is the correct sentence?', options: ['Their going to the store.', 'There going to the store.', 'They\'re going to the store.', 'They going to the store.'], correctAnswerIndex: 2 },
                { category: 'english', text: 'What does the idiom "Bite the bullet" mean?', options: ['To be angry', 'To endure a painful situation', 'To eat something hard', 'To shoot a gun'], correctAnswerIndex: 1 },
                { category: 'english', text: 'Complete the sentence: "He is looking forward ___ you."', options: ['to see', 'to seeing', 'seeing', 'see'], correctAnswerIndex: 1 },
                { category: 'english', text: 'Choose the correct synonym for "Meticulous":', options: ['Careless', 'Thorough', 'Quick', 'Hesitant'], correctAnswerIndex: 1 },
                { category: 'english', text: 'What is the antonym of "Benevolent"?', options: ['Kind', 'Generous', 'Malevolent', 'Polite'], correctAnswerIndex: 2 },
                { category: 'english', text: 'Identify the adjective in: "She delivered an eloquent presentation to the board."', options: ['delivered', 'eloquent', 'presentation', 'board'], correctAnswerIndex: 1 },
                { category: 'english', text: 'Choose the correct spelling:', options: ['Privilege', 'Priviledge', 'Privelege', 'Privilage'], correctAnswerIndex: 0 },
                { category: 'english', text: 'Complete the proverb: "Actions speak louder than ___."', options: ['words', 'promises', 'thoughts', 'shouting'], correctAnswerIndex: 0 },
                { category: 'english', text: 'What does the idiom "Hit the nail on the head" mean?', options: ['To cause an accident', 'To describe exactly what is causing a situation', 'To work very hard in construction', 'To get a headache'], correctAnswerIndex: 1 },
                { category: 'english', text: 'Choose the grammatically correct sentence:', options: ['Neither the manager nor the employees was present.', 'Neither the manager nor the employees were present.', 'Neither the manager or the employees were present.', 'Neither manager nor employees is present.'], correctAnswerIndex: 1 },
                { category: 'english', text: 'What is the synonym of "Pragmatic"?', options: ['Practical', 'Idealistic', 'Confused', 'Theoretical'], correctAnswerIndex: 0 },
                { category: 'english', text: 'Fill in the blank: "We must adapt ___ the changing market conditions."', options: ['with', 'to', 'for', 'at'], correctAnswerIndex: 1 },
                { category: 'english', text: 'Which word means "a person who is new to a subject or activity"?', options: ['Veteran', 'Novice', 'Expert', 'Mentor'], correctAnswerIndex: 1 },
                { category: 'english', text: 'What is the correct plural form of "Analysis"?', options: ['Analysises', 'Analysi', 'Analyses', 'Analysis'], correctAnswerIndex: 2 },
                { category: 'english', text: 'What does the word "Lucid" mean?', options: ['Dark and murky', 'Clear and easy to understand', 'Complicated', 'Angry'], correctAnswerIndex: 1 },
                { category: 'english', text: 'Fill in the blank: "She has been working here ___ 2018."', options: ['since', 'for', 'from', 'in'], correctAnswerIndex: 0 },
                
                // Current Affairs (Original + 12 New)
                { category: 'current_affairs', text: 'Which organization is responsible for global health issues?', options: ['IMF', 'WTO', 'WHO', 'UNICEF'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'What is the primary currency used in the European Union?', options: ['Dollar', 'Pound', 'Euro', 'Franc'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'Which country is the largest emitter of carbon dioxide globally?', options: ['USA', 'India', 'China', 'Russia'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'What is the capital of Ukraine?', options: ['Moscow', 'Minsk', 'Kyiv', 'Warsaw'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'Which tech company produces the iPhone?', options: ['Microsoft', 'Google', 'Samsung', 'Apple'], correctAnswerIndex: 3 },
                { category: 'current_affairs', text: 'What is the name of the central bank of India?', options: ['SBI', 'RBI', 'HDFC', 'ICICI'], correctAnswerIndex: 1 },
                { category: 'current_affairs', text: 'BRICS is an intergovernmental organization comprising Brazil, Russia, India, China, and which other country?', options: ['South Korea', 'Saudi Arabia', 'South Africa', 'Spain'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'Which global summit focuses on climate change negotiations among world leaders?', options: ['G20', 'COP', 'NATO', 'OPEC'], correctAnswerIndex: 1 },
                { category: 'current_affairs', text: 'What is the primary objective of the World Trade Organization (WTO)?', options: ['Regulate global banking', 'Regulate international trade', 'Provide military aid', 'Manage currency exchange rates'], correctAnswerIndex: 1 },
                { category: 'current_affairs', text: 'Which country hosted the 2024 Summer Olympic Games?', options: ['Japan', 'USA', 'France', 'Australia'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'What does the acronym "AI" stand for in modern technology?', options: ['Automated Interface', 'Artificial Intelligence', 'Applied Internet', 'Advanced Integration'], correctAnswerIndex: 1 },
                { category: 'current_affairs', text: 'Which major space agency successfully landed the Chandrayaan-3 mission on the lunar south pole?', options: ['NASA', 'ESA', 'ISRO', 'JAXA'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'What is the name of the global initiative aimed at sustainable development goals by 2030?', options: ['UN SDG 2030', 'Kyoto Protocol', 'Paris Vision', 'Global Compact'], correctAnswerIndex: 0 },
                { category: 'current_affairs', text: 'Which sector is primarily associated with the term "Fintech"?', options: ['Agriculture & Farming', 'Financial Technology & Banking', 'Pharmaceutical Research', 'Textile Manufacturing'], correctAnswerIndex: 1 },
                { category: 'current_affairs', text: 'What is the currency of Japan?', options: ['Yuan', 'Won', 'Yen', 'Ringgit'], correctAnswerIndex: 2 },
                { category: 'current_affairs', text: 'Which international body oversees global monetary cooperation and financial stability?', options: ['World Bank', 'International Monetary Fund (IMF)', 'Asian Development Bank', 'Federal Reserve'], correctAnswerIndex: 1 },
                { category: 'current_affairs', text: 'What is the term used for the transition towards renewable energy and reducing carbon footprints globally?', options: ['Green Transition', 'Industrial Revolution', 'Digital Transformation', 'Urbanization'], correctAnswerIndex: 0 },
                { category: 'current_affairs', text: 'Which organization awards the Nobel Peace Prize annually?', options: ['Swedish Academy', 'Norwegian Nobel Committee', 'UN Security Council', 'World Court'], correctAnswerIndex: 1 },
                { category: 'current_affairs', text: 'In international healthcare, what does "WHO" stand for?', options: ['World Health Organization', 'World Healing Order', 'Western Healthcare Organization', 'Global Health Office'], correctAnswerIndex: 0 },
                
                // General Knowledge (Original + 12 New)
                { category: 'gk', text: 'What is the chemical symbol for Gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctAnswerIndex: 2 },
                { category: 'gk', text: 'Who wrote the play "Romeo and Juliet"?', options: ['Charles Dickens', 'William Shakespeare', 'Mark Twain', 'Jane Austen'], correctAnswerIndex: 1 },
                { category: 'gk', text: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctAnswerIndex: 1 },
                { category: 'gk', text: 'What is the largest ocean on Earth?', options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'], correctAnswerIndex: 3 },
                { category: 'gk', text: 'How many continents are there in the world?', options: ['5', '6', '7', '8'], correctAnswerIndex: 2 },
                { category: 'gk', text: 'Who is known as the Father of the Indian Constitution?', options: ['Mahatma Gandhi', 'Jawaharlal Nehru', 'Dr. B.R. Ambedkar', 'Sardar Patel'], correctAnswerIndex: 2 },
                { category: 'gk', text: 'What is the tallest mountain in the world?', options: ['K2', 'Mount Everest', 'Kangchenjunga', 'Lhotse'], correctAnswerIndex: 1 },
                { category: 'gk', text: 'Which organ in the human body is primarily responsible for filtering blood and removing toxins?', options: ['Heart', 'Liver', 'Lungs', 'Stomach'], correctAnswerIndex: 1 },
                { category: 'gk', text: 'What is the hardest natural substance on Earth?', options: ['Gold', 'Iron', 'Diamond', 'Platinum'], correctAnswerIndex: 2 },
                { category: 'gk', text: 'Which gas makes up the majority of Earth\'s atmosphere?', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'], correctAnswerIndex: 2 },
                { category: 'gk', text: 'What is the speed of light in a vacuum approximately?', options: ['300,000 km/s', '150,000 km/s', '1,000 km/s', '3,000,000 km/s'], correctAnswerIndex: 0 },
                { category: 'gk', text: 'Who is credited with discovering penicillin?', options: ['Louis Pasteur', 'Alexander Fleming', 'Marie Curie', 'Isaac Newton'], correctAnswerIndex: 1 },
                { category: 'gk', text: 'What is the normal human body temperature in Celsius?', options: ['35°C', '37°C', '39°C', '40°C'], correctAnswerIndex: 1 },
                { category: 'gk', text: 'Which vitamin is produced by the human body when exposed to sunlight?', options: ['Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin D'], correctAnswerIndex: 3 },
                { category: 'gk', text: 'What is the chemical formula for table salt?', options: ['NaCl', 'H2O', 'CO2', 'KCl'], correctAnswerIndex: 0 },
                { category: 'gk', text: 'In business and finance, what does "ROI" stand for?', options: ['Return On Investment', 'Rate Of Inflation', 'Risk On Income', 'Revenue Over Interest'], correctAnswerIndex: 0 },
                { category: 'gk', text: 'Which blood group is known as the universal donor?', options: ['A positive', 'AB positive', 'O negative', 'B negative'], correctAnswerIndex: 2 },
                { category: 'gk', text: 'What is the boiling point of water at standard atmospheric pressure?', options: ['50°C', '100°C', '150°C', '200°C'], correctAnswerIndex: 1 },
                { category: 'gk', text: 'What is the primary function of DNA in living organisms?', options: ['Store genetic information', 'Provide structural support', 'Digest food', 'Transport oxygen'], correctAnswerIndex: 0 }
            ];
            const existingQs = await OnboardQuestion.findAll({ attributes: ['text'] });
            const existingTexts = new Set(existingQs.map(q => q.text));
            const newQsToSeed = seedQuestions.filter(q => !existingTexts.has(q.text));
            if (newQsToSeed.length > 0) {
                console.log(`🌱 Seeding ${newQsToSeed.length} new Rapid Test questions into database...`);
                await OnboardQuestion.bulkCreate(newQsToSeed.map(q => ({ _id: generateId(), ...q })));
                console.log('✅ Seeded new questions successfully.');
            }
        } catch (err) {
            console.error('⚠️ Question seeding check failed:', err.message);
        }

    } catch (err) {
        console.error('❌ Database connection error:', err.message);
    }
}

module.exports = {
    sequelize,
    syncDatabase,
    Company,
    Applicant,
    Division,
    HQ,
    Asset,
    TemplateHistory,
    Question,
    ExamResult
};
