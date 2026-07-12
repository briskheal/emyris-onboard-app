const { DataTypes, Op } = require('sequelize');
const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
module.exports = function initModels(sequelize) {

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
    letterFontSize: { type: DataTypes.STRING, defaultValue: '11' },
    letterFontType: { type: DataTypes.STRING, defaultValue: 'Plus Jakarta Sans' },
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
    rapidTestTime: { type: DataTypes.INTEGER, defaultValue: 25 },
    activeExamDate: { type: DataTypes.STRING, defaultValue: "" },
    activeExamProduct: { type: DataTypes.STRING, defaultValue: "" },
    examMcqTime: { type: DataTypes.INTEGER, defaultValue: 15 },
    examDescriptiveTime: { type: DataTypes.INTEGER, defaultValue: 15 },
    examMcqCount: { type: DataTypes.INTEGER, defaultValue: 10 },
    targetProductsList: { type: DataTypes.JSON, defaultValue: ["General", "Emystein", "Briskheal"] },
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
            "Aadhaar Card",
            "PAN Card",
            "Degree/Provisional Certificate",
            "Previous Company Appointment Letter",
            "Last Month Salary Slip",
            "Cancel Cheque",
            "Passport Photo",
            "Resume"
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
    pendingExams: { type: DataTypes.JSON, defaultValue: [] },
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
    targetProduct: { type: DataTypes.STRING, defaultValue: "General" },
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
    testedProduct: { type: DataTypes.STRING, defaultValue: "" },
    totalQuestions: { type: DataTypes.INTEGER, defaultValue: 0 },
    autoScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    manualScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: 'pending_review' },
    answers: { type: DataTypes.JSON, defaultValue: {} },
    submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});
    return { OnboardCompany, OnboardAsset, OnboardApplicant, OnboardDivision, OnboardHQ, OnboardTemplateHistory, OnboardQuestion, OnboardExamResult };
};