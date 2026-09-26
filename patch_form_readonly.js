const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/PrimarySalesForm.tsx';
let f = fs.readFileSync(path, 'utf8');

// Add loadedStatus state
f = f.replace(
    "const [editId, setEditId] = useState(searchParams.get('id'));",
    "const [editId, setEditId] = useState(searchParams.get('id'));\n  const [loadedStatus, setLoadedStatus] = useState('');"
);
// Fallback if the previous didn't work (editId is directly extracted)
f = f.replace(
    "const editId = searchParams.get('id');",
    "const editId = searchParams.get('id');\n  const [loadedStatus, setLoadedStatus] = useState('');"
);

// Set loadedStatus in useEffect
f = f.replace(
    "const d = res.data.data;",
    "const d = res.data.data;\n          setLoadedStatus(d.status || '');"
);

// Add readOnly styles and disables
const readOnlyChecks = [
    { target: `<input type="date" value={header.date}`, replace: `<input type="date" disabled={loadedStatus === 'Approved'} value={header.date}` },
    { target: `<input type="date" value={header.invoiceDate}`, replace: `<input type="date" disabled={loadedStatus === 'Approved'} value={header.invoiceDate}` },
    { target: `<input type="text" value={header.invoiceNumber}`, replace: `<input type="text" disabled={loadedStatus === 'Approved'} value={header.invoiceNumber}` },
    { target: `onClick={() => setSelectingStockist(true)}`, replace: `onClick={() => loadedStatus !== 'Approved' && setSelectingStockist(true)}` },
    { target: `onClick={addItem}`, replace: `onClick={() => loadedStatus !== 'Approved' && addItem()}` }
];

for (const check of readOnlyChecks) {
    f = f.replace(check.target, check.replace);
}

// Hide the Add Item button and Submit button if approved, add Read Only badge to header
f = f.replace(
    `{editId ? "EDIT PRIMARY SALES" : "PRIMARY SALES ENTRY"}` + `}</h1>`,
    `{editId ? (loadedStatus === 'Approved' ? "VIEW PRIMARY SALES" : "EDIT PRIMARY SALES") : "PRIMARY SALES ENTRY"}` + `}</h1>\n          {loadedStatus === 'Approved' && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ml-2 border border-emerald-500/30">Approved</span>}`
);

// Hide delete buttons and product search if read only
f = f.replace(
    `onClick={() => removeItem(index)}`,
    `onClick={() => loadedStatus !== 'Approved' && removeItem(index)}`
);

// Hide submit button section if approved
f = f.replace(
    `<div className="p-4 bg-[#1c1c2e] border-t border-[#3b3b5a] pb-24">`,
    `{loadedStatus !== 'Approved' && (\n        <div className="p-4 bg-[#1c1c2e] border-t border-[#3b3b5a] pb-24">`
);
f = f.replace(
    `{loading ? 'Saving...' : 'Submit to Admin'}\n          </button>\n        </div>\n      </div>`,
    `{loading ? 'Saving...' : 'Submit to Admin'}\n          </button>\n        </div>\n        )}\n      </div>`
);

fs.writeFileSync(path, f);
console.log('Fixed PrimarySalesForm read-only logic');
