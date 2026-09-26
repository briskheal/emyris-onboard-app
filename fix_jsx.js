const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(path, 'utf8');

// Remove the stray )
f = f.replace("          )}\n        </div>\n  \n        {/* MODALS */}", "          \n        </div>\n  \n        {/* MODALS */}");

// Safely wrap the button instead of the entire footer, so they can still see the net values
f = f.replace(
    '<button onClick={handleSave} disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600',
    "{loadedStatus !== 'Approved' && (\n          <button onClick={handleSave} disabled={loading} className=\"w-full bg-emerald-500 hover:bg-emerald-600"
);

f = f.replace(
    "{loading ? 'Saving...' : 'Submit to Admin'}\n            </button>",
    "{loading ? 'Saving...' : 'Submit to Admin'}\n            </button>\n          )}"
);

fs.writeFileSync(path, f);
console.log('Fixed JSX syntax error');
