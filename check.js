require('dotenv').config();
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite:./onboarding_fallback.sqlite', {
  dialect: (process.env.DATABASE_URL || '').startsWith('sqlite') ? 'sqlite' : 'postgres',
  dialectOptions: { ssl: { rejectUnauthorized: false } }
});
sequelize.query('SELECT LENGTH("offerLetterBody") as offer_len, LENGTH("confirmLetterBody") as confirm_len, "activeLetterheadId" FROM "onboard_companies" LIMIT 1').then(res => {
  console.log('Lengths:', res[0][0]);
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
