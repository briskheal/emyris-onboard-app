const { XlDoctor } = require('../db'); async function check() { const drs = await XlDoctor.findAll({ limit: 1 }); console.log(drs[0].toJSON()); } check();
