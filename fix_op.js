const fs = require('fs');
let c = fs.readFileSync('routes/xl.js', 'utf8');

c = c.replace(
    "const { sequelize, Op } = require('../db');", 
    "const { sequelize } = require('../db');\n        const { Op } = require('sequelize');"
);

fs.writeFileSync('routes/xl.js', c);
