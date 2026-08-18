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

    return {
        XlDoctor,
        XlChemist,
        XlStockist,
        XlCity,
        XlRoute
    };
};
