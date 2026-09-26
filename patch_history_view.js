const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesHistory.tsx';
let f = fs.readFileSync(path, 'utf8');

// Change the button condition to always show if it's Approved, Pending, Rejected, or Re-Submitted
f = f.replace(
    "{(inv.status === 'Rejected' || inv.status === 'Pending' || inv.status === 'Re-Submitted') && (",
    "{(inv.status === 'Rejected' || inv.status === 'Pending' || inv.status === 'Re-Submitted' || inv.status === 'Approved') && ("
);

// Change the icon from Edit to Eye if approved
f = f.replace(
    "<Edit size={14} />",
    "{inv.status === 'Approved' ? <Eye size={14} /> : <Edit size={14} />}"
);
// Import Eye if not imported
if (!f.includes("Eye,")) {
    f = f.replace("import { Edit, ", "import { Edit, Eye, ");
}

// Change the button text
f = f.replace(
    "{inv.status === 'Rejected' ? 'Edit & Resubmit' : 'Edit'}",
    "{inv.status === 'Rejected' ? 'Edit & Resubmit' : (inv.status === 'Approved' ? 'View Details' : 'Edit')}"
);

fs.writeFileSync(path, f);
console.log('Fixed PrimarySalesHistory view button logic');
