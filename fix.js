const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgresql://neondb_owner:npg_3FUj8JmzDeLi@ep-wild-firefly-aore0r4s-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
sequelize.query("UPDATE onboard_companies SET name = 'EMYRIS BIOLIFESCIENCES' WHERE name IS NULL").then(r => console.log('Fixed!')).catch(console.error);
