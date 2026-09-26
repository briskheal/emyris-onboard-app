const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(path, 'utf8');

f = f.replace(
    "{loading ? 'Saving...' : 'Submit to Admin'}\\n          </button>\\n        </div>\\n        )}\\n      </div>",
    "{loading ? 'Saving...' : 'Submit to Admin'}\\n          </button>\\n          )}\\n        </div>\\n      </div>"
);

fs.writeFileSync(path, f);
console.log('Fixed block');
