const { XlUser } = require('../db'); async function check() { const u = await XlUser.findAll(); console.log(u.length); } check();
