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
    isExistingStaff: { type: DataTypes.BOOLEAN, defaultValue: false }
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

// Helper to decorate instance with Mongoose methods
function wrapInstance(instance) {
    if (!instance) return instance;
    instance.markModified = (prop) => {
        instance.changed(prop, true);
    };
    instance.toObject = () => instance.get({ plain: true });
    return instance;
}

// Helper to build Sequelize where clause from Mongoose query
function buildWhere(query) {
    if (!query || typeof query !== 'object') return {};
    const where = {};
    for (const [key, value] of Object.entries(query)) {
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
                if (typeof pattern === 'string' && pattern.startsWith('^')) {
                    pattern = pattern.slice(1) + '%';
                } else if (typeof pattern === 'string') {
                    pattern = '%' + pattern + '%';
                }
                where[key] = { [Op.like]: pattern };
            } else if (value.$gte !== undefined) {
                where[key] = { [Op.gte]: value.$gte };
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
    return {
        findOne: async (query) => {
            const inst = await Model.findOne({ where: buildWhere(query) });
            return wrapInstance(inst);
        },
        find: async (query = {}) => {
            const list = await Model.findAll({ where: buildWhere(query) });
            return list.map(wrapInstance);
        },
        findById: async (id) => {
            const inst = await Model.findByPk(id);
            return wrapInstance(inst);
        },
        create: async (data) => {
            if (!data._id) data._id = generateId();
            const inst = await Model.create(data);
            return wrapInstance(inst);
        },
        countDocuments: async (query = {}) => {
            return await Model.count({ where: buildWhere(query) });
        },
        findOneAndUpdate: async (query, updateObj, options = {}) => {
            const inst = await Model.findOne({ where: buildWhere(query) });
            if (!inst) return null;
            applyUpdate(inst, updateObj);
            await inst.save();
            return wrapInstance(inst);
        },
        findByIdAndUpdate: async (id, updateObj, options = {}) => {
            const inst = await Model.findByPk(id);
            if (!inst) return null;
            applyUpdate(inst, updateObj);
            await inst.save();
            return wrapInstance(inst);
        },
        updateOne: async (query, updateObj) => {
            const inst = await Model.findOne({ where: buildWhere(query) });
            if (inst) {
                applyUpdate(inst, updateObj);
                await inst.save();
            }
            return { acknowledged: true };
        },
        deleteOne: async (query) => {
            const count = await Model.destroy({ where: buildWhere(query), limit: 1 });
            return { deletedCount: count };
        },
        deleteMany: async (query = {}) => {
            const count = await Model.destroy({ where: buildWhere(query) });
            return { deletedCount: count };
        },
        findByIdAndDelete: async (id) => {
            const inst = await Model.findByPk(id);
            if (inst) await inst.destroy();
            return wrapInstance(inst);
        }
    };
}

function applyUpdate(instance, updateObj) {
    if (!updateObj) return;
    const data = updateObj.$set ? { ...updateObj.$set } : { ...updateObj };
    delete data.$set;
    delete data.$push;
    delete data.$pull;

    for (const [key, val] of Object.entries(data)) {
        if (key.startsWith('$')) continue;
        instance[key] = val;
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

async function syncDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to Shared PostgreSQL Database via Sequelize.');
        await sequelize.sync({ alter: true });
        console.log('✅ Synchronized onboard_* tables in database.');
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
    TemplateHistory
};
