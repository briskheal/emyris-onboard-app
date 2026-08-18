const { DataTypes } = require('sequelize');

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

module.exports = function initXlModels(sequelize) {
    const XlDoctor = sequelize.define('xl_doctor', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        name: { type: DataTypes.STRING, allowNull: false },
        degree: { type: DataTypes.STRING },
        specialization: { type: DataTypes.STRING },
        hospital: { type: DataTypes.STRING },
        birthday: { type: DataTypes.STRING },
        anniversary: { type: DataTypes.STRING },
        mobileNumber: { type: DataTypes.STRING },
        contactNumber: { type: DataTypes.STRING },
        doctorCode: { type: DataTypes.STRING },
        emailAddress: { type: DataTypes.STRING },
        category: { type: DataTypes.STRING },
        address: { type: DataTypes.TEXT },
        hq: { type: DataTypes.STRING },
        workingArea: { type: DataTypes.STRING },
        extraInfo: { type: DataTypes.TEXT },
        imagePath: { type: DataTypes.STRING },
        allottedUser: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING, defaultValue: 'Pending' },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlChemist = sequelize.define('xl_chemist', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        businessName: { type: DataTypes.STRING, allowNull: false },
        proprietorName: { type: DataTypes.STRING },
        certification: { type: DataTypes.STRING },
        birthday: { type: DataTypes.STRING },
        mobileNumber: { type: DataTypes.STRING },
        emailAddress: { type: DataTypes.STRING },
        address: { type: DataTypes.TEXT },
        hq: { type: DataTypes.STRING },
        workingArea: { type: DataTypes.STRING },
        extraInfo: { type: DataTypes.TEXT },
        imagePath: { type: DataTypes.STRING },
        allottedUser: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING, defaultValue: 'Pending' },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlStockist = sequelize.define('xl_stockist', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        businessName: { type: DataTypes.STRING, allowNull: false },
        proprietorName: { type: DataTypes.STRING },
        certification: { type: DataTypes.STRING },
        gstNumber: { type: DataTypes.STRING },
        drugLicenseNumber: { type: DataTypes.STRING },
        drugLicenseExpiry: { type: DataTypes.STRING },
        establishmentDate: { type: DataTypes.STRING },
        mobileNumber: { type: DataTypes.STRING },
        emailAddress: { type: DataTypes.STRING },
        address: { type: DataTypes.TEXT },
        hq: { type: DataTypes.STRING },
        workingArea: { type: DataTypes.STRING },
        extraInfo: { type: DataTypes.TEXT },
        imagePath: { type: DataTypes.STRING },
        allottedUser: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING, defaultValue: 'Pending' },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlCity = sequelize.define('xl_city', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        state: { type: DataTypes.STRING, allowNull: false },
        hq: { type: DataTypes.STRING, allowNull: false },
        cityName: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.STRING, defaultValue: 'Pending' },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    const XlRoute = sequelize.define('xl_route', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        state: { type: DataTypes.STRING, allowNull: false },
        hq: { type: DataTypes.STRING, allowNull: false },
        fromCity: { type: DataTypes.STRING, allowNull: false },
        toCity: { type: DataTypes.STRING, allowNull: false },
        areaType: { type: DataTypes.STRING }, // Local, Ex-Station, Out-Station
        distance: { type: DataTypes.FLOAT },
        status: { type: DataTypes.STRING, defaultValue: 'Pending' },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    // Phase 2: Tour Program
    const XlTourProgram = sequelize.define('xl_tour_program', {
        _id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateId },
        employeeEmail: { type: DataTypes.STRING, allowNull: false },
        employeeName: { type: DataTypes.STRING },
        hq: { type: DataTypes.STRING },
        month: { type: DataTypes.STRING, allowNull: false }, // e.g. "august"
        year: { type: DataTypes.STRING, allowNull: false },  // e.g. "2026"
        entries: { type: DataTypes.TEXT, defaultValue: '[]' }, // JSON array of {date, visitType, area}
        status: { type: DataTypes.STRING, defaultValue: 'Draft' }, // Draft / Submitted / Approved / Rejected
        adminRemarks: { type: DataTypes.TEXT },
        submittedAt: { type: DataTypes.DATE },
        approvedAt: { type: DataTypes.DATE },
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
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    return {
        XlDoctor,
        XlChemist,
        XlStockist,
        XlCity,
        XlRoute,
        XlTourProgram,
        XlDCR
    };
};
