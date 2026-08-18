const express = require('express');
const router = express.Router();
const { XlDoctor, XlChemist, XlStockist, XlCity, XlRoute } = require('../db');

// Add a Doctor
router.post('/doctor', async (req, res) => {
    try {
        const doctor = await XlDoctor.create(req.body);
        res.json({ success: true, message: 'Doctor created successfully!', data: doctor });
    } catch (e) {
        console.error('Error creating doctor:', e);
        res.status(500).json({ error: 'Failed to create doctor' });
    }
});

// Add a Chemist
router.post('/chemist', async (req, res) => {
    try {
        const chemist = await XlChemist.create(req.body);
        res.json({ success: true, message: 'Chemist created successfully!', data: chemist });
    } catch (e) {
        console.error('Error creating chemist:', e);
        res.status(500).json({ error: 'Failed to create chemist' });
    }
});

// Add a Stockist
router.post('/stockist', async (req, res) => {
    try {
        const stockist = await XlStockist.create(req.body);
        res.json({ success: true, message: 'Stockist created successfully!', data: stockist });
    } catch (e) {
        console.error('Error creating stockist:', e);
        res.status(500).json({ error: 'Failed to create stockist' });
    }
});

// Add a City
router.post('/city', async (req, res) => {
    try {
        const city = await XlCity.create(req.body);
        res.json({ success: true, message: 'City created successfully!', data: city });
    } catch (e) {
        console.error('Error creating city:', e);
        res.status(500).json({ error: 'Failed to create city' });
    }
});

// Add a Route
router.post('/route', async (req, res) => {
    try {
        const route = await XlRoute.create(req.body);
        res.json({ success: true, message: 'Route created successfully!', data: route });
    } catch (e) {
        console.error('Error creating route:', e);
        res.status(500).json({ error: 'Failed to create route' });
    }
});

module.exports = router;
