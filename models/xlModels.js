const { DataTypes } = require('sequelize');

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

module.exports = function initXlModels(sequelize) {
    const XlDoctorControl = sequelize.define('xl_doctor_control', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        type: { type: DataTypes.STRING, allowNull: false }, // Degree, Specialization, Hospital, Category
        name: { type: DataTypes.STRING, allowNull: false },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlDoctor = sequelize.define('xl_doctor', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        name: { type: DataTypes.STRING, allowNull: false },
        degree: { type: DataTypes.STRING },
        specialization: { type: DataTypes.STRING },
        hospital: { type: DataTypes.STRING },
        birthday: { type: DataTypes.STRING },
        anniversary: { type: DataTypes.STRING },
        mobile: { type: DataTypes.STRING },
        clinicContact: { type: DataTypes.STRING },
        contact: { type: DataTypes.STRING },
        doctorCode: { type: DataTypes.STRING },
        email: { type: DataTypes.STRING },
        category: { type: DataTypes.STRING },
        uid: { type: DataTypes.STRING },
        address: { type: DataTypes.TEXT },
        headquarter: { type: DataTypes.STRING },
        workingArea: { type: DataTypes.STRING },
        extraInformation: { type: DataTypes.TEXT },
        
        userAllotted: { type: DataTypes.STRING },
        updateAt: { type: DataTypes.STRING },
        
        status: { type: DataTypes.STRING, defaultValue: 'Pending' },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlChemist = sequelize.define('xl_chemist', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        businessName: { type: DataTypes.STRING, allowNull: false },
        proprietorName: { type: DataTypes.STRING },
        uid: { type: DataTypes.STRING },
        certifications: { type: DataTypes.STRING },
        birthday: { type: DataTypes.STRING },
        mobile: { type: DataTypes.STRING },
        email: { type: DataTypes.STRING },
        address: { type: DataTypes.TEXT },
        headquarter: { type: DataTypes.STRING },
        workingArea: { type: DataTypes.STRING },
        extraInformation: { type: DataTypes.TEXT },
        userAllotted: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING, defaultValue: 'Pending' },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlStockist = sequelize.define('xl_stockist', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        businessName: { type: DataTypes.STRING, allowNull: false },
        name: { type: DataTypes.STRING },
        uid: { type: DataTypes.STRING },
        certifications: { type: DataTypes.STRING },
        email: { type: DataTypes.STRING },
        gst: { type: DataTypes.STRING },
        drugLicense: { type: DataTypes.STRING },
        drugExpiryDate: { type: DataTypes.STRING },
        establishmentDate: { type: DataTypes.STRING },
        mobile: { type: DataTypes.STRING },
        address: { type: DataTypes.TEXT },
        headquarter: { type: DataTypes.STRING },
        workingArea: { type: DataTypes.STRING },
        extraInformation: { type: DataTypes.TEXT },
        userAllotted: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING, defaultValue: 'Pending' },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlState = sequelize.define('xl_state', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING }, // e.g. STE1
        stateName: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.STRING, defaultValue: 'Active' },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlHQ = sequelize.define('xl_hq', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING }, // e.g. HQS1
        state: { type: DataTypes.STRING, allowNull: false },
        hqName: { type: DataTypes.STRING, allowNull: false, set(val) { if(val) this.setDataValue('hqName', val.toUpperCase().trim()); } },
        status: { type: DataTypes.STRING, defaultValue: 'Active' },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlCity = sequelize.define('xl_city', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING }, // e.g. CTY1
        state: { type: DataTypes.STRING, allowNull: false },
        hq: { type: DataTypes.STRING, allowNull: false, set(val) { if(val) this.setDataValue('hq', val.toUpperCase().trim()); } },
        cityName: { type: DataTypes.STRING, allowNull: false },
        areaType: { type: DataTypes.STRING, defaultValue: 'City' },
        status: { type: DataTypes.STRING, defaultValue: 'Active' },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlRoute = sequelize.define('xl_route', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING }, 
        state: { type: DataTypes.STRING, allowNull: false },
        hq: { type: DataTypes.STRING, allowNull: false, set(val) { if(val) this.setDataValue('hq', val.toUpperCase().trim()); } },
        fromCity: { type: DataTypes.STRING, allowNull: false },
        toCity: { type: DataTypes.STRING, allowNull: false },
        areaType: { type: DataTypes.STRING }, // Local, Ex-Station, Out-Station
        distance: { type: DataTypes.FLOAT },
        status: { type: DataTypes.STRING, defaultValue: 'Active' },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlDivision = sequelize.define('xl_division', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING },
        divisionName: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.STRING, defaultValue: 'Active' },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlDesignation = sequelize.define('xl_designation', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING },
        designationName: { type: DataTypes.STRING, allowNull: false },
        level: { type: DataTypes.INTEGER, allowNull: false },
        dailyAllowance: { type: DataTypes.FLOAT },
        exStationAllowance: { type: DataTypes.FLOAT },
        outStationAllowance: { type: DataTypes.FLOAT },
        status: { type: DataTypes.STRING, defaultValue: 'Active' },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlUser = sequelize.define('xl_user', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING },
        firstName: { type: DataTypes.STRING, allowNull: false },
        middleName: { type: DataTypes.STRING },
        lastName: { type: DataTypes.STRING },
        gender: { type: DataTypes.STRING },
        phone: { type: DataTypes.STRING },
        email: { type: DataTypes.STRING },
        password: { type: DataTypes.STRING },
        dob: { type: DataTypes.STRING },
        hq: { type: DataTypes.STRING, set(val) { if(val) this.setDataValue('hq', val.toUpperCase().trim()); } },
        designation: { type: DataTypes.STRING },
        division: { type: DataTypes.STRING },
        employeeId: { type: DataTypes.STRING },
        doj: { type: DataTypes.STRING },
        reportingManager: { type: DataTypes.STRING },
        aadhar: { type: DataTypes.STRING },
        pan: { type: DataTypes.STRING },
        dailyAllowance: { type: DataTypes.FLOAT },
        exStationAllowance: { type: DataTypes.FLOAT },
        outStationAllowance: { type: DataTypes.FLOAT },
        streetAddress1: { type: DataTypes.STRING },
        streetAddress2: { type: DataTypes.STRING },
        city: { type: DataTypes.STRING },
        state: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING, defaultValue: 'Active' },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlAdmin = sequelize.define('xl_admin', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING },
        firstName: { type: DataTypes.STRING, allowNull: false },
        middleName: { type: DataTypes.STRING },
        lastName: { type: DataTypes.STRING },
        gender: { type: DataTypes.STRING },
        phone: { type: DataTypes.STRING },
        email: { type: DataTypes.STRING },
        password: { type: DataTypes.STRING },
        dob: { type: DataTypes.STRING },
        hq: { type: DataTypes.STRING, set(val) { if(val) this.setDataValue('hq', val.toUpperCase().trim()); } },
        designation: { type: DataTypes.STRING },
        division: { type: DataTypes.STRING },
        employeeId: { type: DataTypes.STRING },
        doj: { type: DataTypes.STRING },
        reportingManager: { type: DataTypes.STRING },
        aadhar: { type: DataTypes.STRING },
        pan: { type: DataTypes.STRING },
        dailyAllowance: { type: DataTypes.FLOAT },
        exStationAllowance: { type: DataTypes.FLOAT },
        outStationAllowance: { type: DataTypes.FLOAT },
        streetAddress1: { type: DataTypes.STRING },
        streetAddress2: { type: DataTypes.STRING },
        city: { type: DataTypes.STRING },
        state: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING, defaultValue: 'Active' },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    // Phase 2: Tour Program
    const XlTourProgram = sequelize.define('xl_tour_program', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeEmail: { type: DataTypes.STRING, allowNull: false },
        employeeName: { type: DataTypes.STRING },
        hq: { type: DataTypes.STRING, set(val) { if(val) this.setDataValue('hq', val.toUpperCase().trim()); } },
        month: { type: DataTypes.STRING, allowNull: false }, // e.g. "august"
        year: { type: DataTypes.STRING, allowNull: false },  // e.g. "2026"
        entries: { type: DataTypes.TEXT, defaultValue: '[]' }, // JSON array of {date, visitType, area}
        status: { type: DataTypes.STRING, defaultValue: 'Draft' }, // Draft / Submitted / Approved / Rejected
        adminRemarks: { type: DataTypes.TEXT },
        submittedAt: { type: DataTypes.DATE },
        approvedAt: { type: DataTypes.DATE },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    // Phase 2: Daily Call Report (DCR)
    const XlDCR = sequelize.define('xl_dcr', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeEmail: { type: DataTypes.STRING, allowNull: false },
        employeeName: { type: DataTypes.STRING },
        date: { type: DataTypes.STRING, allowNull: false },         // "YYYY-MM-DD"
        tourProgramId: { type: DataTypes.STRING },                  // FK to xl_tour_program
        entityType: { type: DataTypes.STRING },                     // "Doctor" or "Chemist"
        entityId: { type: DataTypes.STRING },                       // FK to xl_doctor or xl_chemist
        entityName: { type: DataTypes.STRING },
        discussion: { type: DataTypes.TEXT },
        samplesGiven: { type: DataTypes.TEXT, defaultValue: '[]' }, // JSON [{product, qty}]
        gifts: { type: DataTypes.TEXT, defaultValue: '[]' },        // JSON [{item, qty}]
        checkInTime: { type: DataTypes.STRING },
        checkOutTime: { type: DataTypes.STRING },
        latitude: { type: DataTypes.FLOAT },
        longitude: { type: DataTypes.FLOAT },
        geoAddress: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING, defaultValue: 'Submitted' },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    // Phase 3: Attendance
    const XlAttendance = sequelize.define('xl_attendance', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeEmail: { type: DataTypes.STRING, allowNull: false },
        date: { type: DataTypes.STRING, allowNull: false }, // "YYYY-MM-DD"
        punchInTime: { type: DataTypes.STRING },
        punchInLat: { type: DataTypes.FLOAT },
        punchInLng: { type: DataTypes.FLOAT },
        punchOutTime: { type: DataTypes.STRING },
        punchOutLat: { type: DataTypes.FLOAT },
        punchOutLng: { type: DataTypes.FLOAT },
        status: { type: DataTypes.STRING, defaultValue: 'Present' },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    // Phase 3: Leave Request
    const XlLeave = sequelize.define('xl_leave', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeEmail: { type: DataTypes.STRING, allowNull: false },
        startDate: { type: DataTypes.STRING, allowNull: false },
        endDate: { type: DataTypes.STRING, allowNull: false },
        leaveType: { type: DataTypes.STRING }, // Sick, Casual, Paid
        reason: { type: DataTypes.TEXT },
        status: { type: DataTypes.STRING, defaultValue: 'Pending' }, // Pending / Approved / Rejected
        adminRemarks: { type: DataTypes.TEXT },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    // Phase 3: Expense
    const XlExpense = sequelize.define('xl_expense', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeEmail: { type: DataTypes.STRING, allowNull: false },
        date: { type: DataTypes.STRING, allowNull: false },
        amount: { type: DataTypes.FLOAT, allowNull: false },
        category: { type: DataTypes.STRING }, // Travel, DA, Hotel, Misc
        remarks: { type: DataTypes.TEXT },
        receiptImage: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING, defaultValue: 'Pending' },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    // Phase 3: Backlog Request
    const XlBacklogRequest = sequelize.define('xl_backlog_request', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeEmail: { type: DataTypes.STRING, allowNull: false },
        date: { type: DataTypes.STRING, allowNull: false }, // The past date requested to unlock
        reason: { type: DataTypes.TEXT },
        status: { type: DataTypes.STRING, defaultValue: 'Pending' }, // Pending / Approved / Rejected
        adminRemarks: { type: DataTypes.TEXT },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    // Phase 3: Call Plan
    const XlCallPlan = sequelize.define('xl_call_plan', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeEmail: { type: DataTypes.STRING, allowNull: false },
        date: { type: DataTypes.STRING, allowNull: false },
        doctors: { type: DataTypes.TEXT, defaultValue: '[]' }, // JSON array of doctor IDs
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    // Phase 4: Performance Analysis
    const XlPerformanceAnalysis = sequelize.define('xl_performance_analysis', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeEmail: { type: DataTypes.STRING, allowNull: false },
        month: { type: DataTypes.STRING, allowNull: false },
        year: { type: DataTypes.STRING, allowNull: false },
        
        // JSON arrays storing [{ entityId, entityName, entityType, week1: { planned, achieved }, ... }]
        brandData: { type: DataTypes.TEXT, defaultValue: '[]' },
        roiData: { type: DataTypes.TEXT, defaultValue: '[]' },
        accountData: { type: DataTypes.TEXT, defaultValue: '[]' },
        keyCustomerData: { type: DataTypes.TEXT, defaultValue: '[]' },
        outstandingData: { type: DataTypes.TEXT, defaultValue: '[]' },
        
        planningSubmittedAt: { type: DataTypes.DATE },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlProductCategory = sequelize.define('xl_product_category', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING },
        categoryName: { type: DataTypes.STRING, allowNull: false },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlProductType = sequelize.define('xl_product_type', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING },
        typeName: { type: DataTypes.STRING, allowNull: false },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlProduct = sequelize.define('xl_product', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING },
        productName: { type: DataTypes.STRING, allowNull: false },
        composition: { type: DataTypes.STRING },
        category: { type: DataTypes.STRING },
        type: { type: DataTypes.STRING },
        manufacturer: { type: DataTypes.STRING },
        packaging: { type: DataTypes.STRING },
        mrp: { type: DataTypes.FLOAT },
        pts: { type: DataTypes.FLOAT },
        ptr: { type: DataTypes.FLOAT },
        division: { type: DataTypes.STRING },
        gst: { type: DataTypes.FLOAT },
        stock: { type: DataTypes.INTEGER, defaultValue: 0 },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlProductSupplier = sequelize.define('xl_product_supplier', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING },
        supplierName: { type: DataTypes.STRING, allowNull: false },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlInventory = sequelize.define('xl_inventory', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING },
        date: { type: DataTypes.DATE },
        supplier: { type: DataTypes.STRING },
        product: { type: DataTypes.STRING },
        unitPrice: { type: DataTypes.FLOAT },
        quantity: { type: DataTypes.INTEGER },
        totalPrice: { type: DataTypes.FLOAT },
        batchNumber: { type: DataTypes.STRING },
        expiryDate: { type: DataTypes.DATE },
        fileUrl: { type: DataTypes.STRING },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlTravelAllowance = sequelize.define('xl_travel_allowance', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        state: { type: DataTypes.STRING, allowNull: false },
        designation: { type: DataTypes.STRING, allowNull: false },
        fromDistance: { type: DataTypes.INTEGER, allowNull: false },
        toDistance: { type: DataTypes.INTEGER, allowNull: false },
        allowancePerKm: { type: DataTypes.FLOAT, allowNull: false },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    
    const XlTarget = sequelize.define('xl_target', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        userEmail: { type: DataTypes.STRING, allowNull: false },
        userName: { type: DataTypes.STRING },
        targetPeriod: { type: DataTypes.STRING, allowNull: false },
        month: { type: DataTypes.STRING },
        year: { type: DataTypes.STRING, allowNull: false },
        allocationType: { type: DataTypes.STRING, allowNull: false },
        lumpSumAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
        productTargets: { type: DataTypes.JSON, defaultValue: [] },
        totalProductAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlOutStationAllowance = sequelize.define('xl_out_station_allowance', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        state: { type: DataTypes.STRING, allowNull: false },
        designation: { type: DataTypes.STRING, allowNull: false },
        category: { type: DataTypes.STRING, allowNull: false }, // e.g., 'Hotel', 'Food'
        amount: { type: DataTypes.FLOAT, allowNull: false },
        excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    return {
        XlDoctor,
        XlChemist,
        XlStockist, XlDoctorControl,
        XlState,
        XlHQ,
        XlCity,
        XlRoute,
        XlDivision,
        XlDesignation,
        XlUser,
        XlAdmin,
        XlTourProgram,
        XlDCR,
        XlAttendance,
        XlLeave,
        XlExpense,
        XlBacklogRequest,
        XlCallPlan,
        XlPerformanceAnalysis,
        XlProductCategory,
        XlProductType,
        XlProduct,
        XlProductSupplier,
        XlInventory,
        XlTravelAllowance,
        XlOutStationAllowance
    };
};
