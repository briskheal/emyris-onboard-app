const fs = require('fs');
const file = 'xla-frontend/src/pages/ManageUsers.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    "px-8 rounded-xl transition-colors\">{loading ? 'Submitting...' : 'Submit'}</button>\r\n          </div>\r\n        </form>",
    "px-8 rounded-xl transition-colors\">{loading ? 'Submitting...' : 'Submit'}</button>\r\n          </div>\r\n          </div>\r\n        </form>"
);
code = code.replace(
    "px-8 rounded-xl transition-colors\">{loading ? 'Submitting...' : 'Submit'}</button>\n          </div>\n        </form>",
    "px-8 rounded-xl transition-colors\">{loading ? 'Submitting...' : 'Submit'}</button>\n          </div>\n          </div>\n        </form>"
);

fs.writeFileSync(file, code);
console.log('Fixed JSX!');
