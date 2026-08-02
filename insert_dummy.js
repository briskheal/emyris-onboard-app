const { Sequelize } = require('./node_modules/sequelize');

async function runTest() {
    const sequelize = new Sequelize('sqlite:./onboarding_fallback.sqlite', { dialect: 'sqlite', logging: false });
    try {
        await sequelize.query(`
            INSERT INTO onboard_applicants (email, fullName, phone, password, status, _id, createdAt, updatedAt)
            VALUES ('dummy@test.com', 'Dummy Applicant', '1234567890', 'pass', 'approved', 'dummy_id_123', datetime('now'), datetime('now'))
        `);
        console.log("Dummy inserted");
    } catch (e) {
        if (e.message.includes('UNIQUE')) console.log('Dummy inserted (already exists)');
        else console.log(e.message);
    }
}
runTest();
