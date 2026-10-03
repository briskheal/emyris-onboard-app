const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const oldMappingLogic = `                let guessedPriceType = ex.priceType || 'Custom';
                if (!ex.priceType && ex.price !== undefined) {
                  if (ex.price == p.pts) guessedPriceType = 'PTS';
                  else if (ex.price == p.ptr) guessedPriceType = 'PTR';
                  else if (ex.price == p.mrp) guessedPriceType = 'MRP';
                }`;

const newMappingLogic = `                let guessedPriceType = ex.priceType || 'CUSTOM';
                if (!ex.priceType) {
                   guessedPriceType = (ex.price && parseFloat(ex.price) > 0) ? 'CUSTOM' : 'PTS';
                }`;

if (c.includes(oldMappingLogic)) {
    c = c.replace(oldMappingLogic, newMappingLogic);
    fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
    console.log("Successfully replaced mapping logic!");
} else {
    console.log("Could not find the old mapping logic block!");
}
