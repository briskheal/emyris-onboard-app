const fs = require('fs');
const file = 'xla-frontend/src/pages/ManageUsers.tsx';
let code = fs.readFileSync(file, 'utf8');

// Let's brute force find the JSX element that is open
code = code.replace(
  "</form>\r\n      </div>\r\n    );",
  "  </div>\r\n</form>\r\n      </div>\r\n    );"
);
code = code.replace(
  "</form>\n      </div>\n    );",
  "  </div>\n</form>\n      </div>\n    );"
);
fs.writeFileSync(file, code);
