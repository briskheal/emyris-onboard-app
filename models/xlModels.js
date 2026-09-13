const { DataTypes } = require('sequelize');

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

module.exports = function initXlModels(sequelize) {
    const XlSample = sequelize.define('xl_sample', {
    _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
    employeeId: { type: DataTypes.STRING, allowNull: false },
    month: { type: DataTypes.STRING },
    year: { type: DataTypes.STRING },
    details: { type: DataTypes.TEXT },
    status: { type: DataTypes.STRING, defaultValue: 'Pending' },
    adminRemarks: { type: DataTypes.STRING },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const XlGift = sequelize.define('xl_gift', {
    _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
    employeeId: { type: DataTypes.STRING, allowNull: false },
    month: { type: DataTypes.STRING },
    year: { type: DataTypes.STRING },
    details: { type: DataTypes.TEXT },
    status: { type: DataTypes.STRING, defaultValue: 'Pending' },
    adminRemarks: { type: DataTypes.STRING },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const XlPrimarySales = sequelize.define('xl_primary_sales', {
    _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
    employeeId: { type: DataTypes.STRING, allowNull: false },
    month: { type: DataTypes.STRING },
    year: { type: DataTypes.STRING },
    date: { type: DataTypes.STRING },
    invoiceDate: { type: DataTypes.STRING },
    invoiceNumber: { type: DataTypes.STRING },
    division: { type: DataTypes.STRING },
    headquarter: { type: DataTypes.STRING },
    stockist: { type: DataTypes.STRING },
    amount: { type: DataTypes.FLOAT },
    grossInvValue: { type: DataTypes.FLOAT },
    netInvValue: { type: DataTypes.FLOAT },
    productsData: { type: DataTypes.TEXT },
    status: { type: DataTypes.STRING, defaultValue: 'Pending' },
    adminRemarks: { type: DataTypes.STRING },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

    const XlAssignedLeave = sequelize.define('xl_assigned_leave', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeId: { type: DataTypes.STRING, allowNull: false },
        year: { type: DataTypes.STRING, allowNull: false }, // e.g. "2026-2027"
        leaveType: { type: DataTypes.STRING, allowNull: false }, // E.g., "Casual Leave" or type _id
        assigned: { type: DataTypes.INTEGER, defaultValue: 0 },
        used: { type: DataTypes.INTEGER, defaultValue: 0 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlLeaveTemplate = sequelize.define('xl_leave_template', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT },
        payload: { type: DataTypes.TEXT }, // JSON string of [{leaveType, count}]
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlLeave = sequelize.define('xl_leave', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeId: { type: DataTypes.STRING, allowNull: false },
        startDate: { type: DataTypes.STRING, allowNull: false },
        endDate: { type: DataTypes.STRING, allowNull: false },
        leaveType: { type: DataTypes.STRING }, // Sick, Casual, Paid
        reason: { type: DataTypes.TEXT },
        status: { type: DataTypes.STRING, defaultValue: 'Pending' }, // Pending / Approved / Rejected
        adminRemarks: { type: DataTypes.TEXT },
        // excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    // Phase 3: Expense
    const XlExpense = sequelize.define('xl_expense', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeId: { type: DataTypes.STRING, allowNull: false },
        date: { type: DataTypes.STRING, allowNull: false },
        amount: { type: DataTypes.FLOAT, allowNull: false },
        category: { type: DataTypes.STRING }, // Travel, DA, Hotel, Misc
        remarks: { type: DataTypes.TEXT },
        receiptImage: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING, defaultValue: 'Pending' },
        // excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    // Phase 3: Backlog Request
    const XlBacklogRequest = sequelize.define('xl_backlog_request', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeId: { type: DataTypes.STRING, allowNull: false },
        date: { type: DataTypes.STRING, allowNull: false }, // The past date requested to unlock
        reason: { type: DataTypes.TEXT },
        status: { type: DataTypes.STRING, defaultValue: 'Pending' }, // Pending / Approved / Rejected
        adminRemarks: { type: DataTypes.TEXT },
        // excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    // Phase 3: Call Plan
    const XlCallPlan = sequelize.define('xl_call_plan', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeId: { type: DataTypes.STRING, allowNull: false },
        date: { type: DataTypes.STRING, allowNull: false },
        doctors: { type: DataTypes.TEXT, defaultValue: '[]' }, chemists: { type: DataTypes.TEXT, defaultValue: '[]' }, stockists: { type: DataTypes.TEXT, defaultValue: '[]' }, // JSON array of doctor IDs
          status: { type: DataTypes.STRING, defaultValue: 'Pending' },
          adminRemarks: { type: DataTypes.TEXT },
        // excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    // Phase 4: Performance Analysis
    const XlPerformanceAnalysis = sequelize.define('xl_performance_analysis', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeId: { type: DataTypes.STRING, allowNull: false },
        month: { type: DataTypes.STRING, allowNull: false },
        year: { type: DataTypes.STRING, allowNull: false },
        
        // JSON arrays storing [{ entityId, entityName, entityType, week1: { planned, achieved }, ... }]
        brandData: { type: DataTypes.TEXT, defaultValue: '[]' },
        roiData: { type: DataTypes.TEXT, defaultValue: '[]' },
        accountData: { type: DataTypes.TEXT, defaultValue: '[]' },
        keyCustomerData: { type: DataTypes.TEXT, defaultValue: '[]' },
        outstandingData: { type: DataTypes.TEXT, defaultValue: '[]' },
        
        planningSubmittedAt: { type: DataTypes.DATE },
        unlockRequested: { type: DataTypes.BOOLEAN, defaultValue: false },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlProductCategory = sequelize.define('xl_product_category', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING },
        categoryName: { type: DataTypes.STRING, allowNull: false },
        // excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlProductType = sequelize.define('xl_product_type', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING },
        typeName: { type: DataTypes.STRING, allowNull: false },
        // excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
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
        // excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlProductSupplier = sequelize.define('xl_product_supplier', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        uid: { type: DataTypes.STRING },
        supplierName: { type: DataTypes.STRING, allowNull: false },
        // excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
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
        // excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlTravelAllowance = sequelize.define('xl_travel_allowance', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        state: { type: DataTypes.STRING, allowNull: false },
        designation: { type: DataTypes.STRING, allowNull: false },
        fromDistance: { type: DataTypes.INTEGER, allowNull: false },
        toDistance: { type: DataTypes.INTEGER, allowNull: false },
        allowancePerKm: { type: DataTypes.FLOAT, allowNull: false },
        // excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    
    const XlTarget = sequelize.define('xl_target', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeId: { type: DataTypes.STRING, allowNull: false },
        userName: { type: DataTypes.STRING },
        targetPeriod: { type: DataTypes.STRING, allowNull: false },
        month: { type: DataTypes.STRING },
        year: { type: DataTypes.STRING, allowNull: false },
        allocationType: { type: DataTypes.STRING, allowNull: false },
        lumpSumAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
        productTargets: { type: DataTypes.JSON, defaultValue: [] },
        totalProductAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
        // excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlOutStationAllowance = sequelize.define('xl_out_station_allowance', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        state: { type: DataTypes.STRING, allowNull: false },
        designation: { type: DataTypes.STRING, allowNull: false },
        category: { type: DataTypes.STRING, allowNull: false }, // e.g., 'Hotel', 'Food'
        amount: { type: DataTypes.FLOAT, allowNull: false },
        // excelRowIndex: { type: DataTypes.INTEGER, defaultValue: 999999 },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlGlobalSettings = sequelize.define('xl_global_settings', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => Math.random().toString(36).substr(2, 9) },
        settings: { type: DataTypes.JSON, defaultValue: {} },
        updatedBy: { type: DataTypes.STRING },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlHoliday = sequelize.define('xl_holiday', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: () => Math.random().toString(36).substr(2, 9) },
        date: { type: DataTypes.DATEONLY, allowNull: false },
        type: { type: DataTypes.STRING, allowNull: false },
        state: { type: DataTypes.STRING },
        title: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    return {
        XlHoliday,
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
        XlLeaveType,
        XlAssignedLeave,
        XlLeaveTemplate,
        XlExpense,
        XlBacklogRequest,
        XlCallPlan,
        XlPerformanceAnalysis,
        XlNotification,
        XlProductCategory,
        XlProductType,
        XlProduct,
        XlProductSupplier,
        XlInventory,
        XlTravelAllowance,
        XlOutStationAllowance,
        XlGeoFencing,
        XlGlobalSettings,
        XlTarget
    };
};
