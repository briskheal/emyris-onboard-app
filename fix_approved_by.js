const { XlDCR } = require('./db'); async function fix() { await XlDCR.update({ approvedBy: 'Admin' }, { where: { status: 'Approved', approvedBy: null } }); console.log('Done'); } fix();
