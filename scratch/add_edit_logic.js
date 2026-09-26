const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

// 1. ManageDCS outer state
c = c.replace(
  "const [activeTab, setActiveTab] = useState('edit_delete');",
  "const [activeTab, setActiveTab] = useState('edit_delete');\n  const [editingRecord, setEditingRecord] = useState<any>(null);\n  const [editingType, setEditingType] = useState<string>('');"
);

// 2. EditDeleteTabComponent props
c = c.replace(
  "const EditDeleteTabComponent = ({ doctors, chemists, stockists, hqs, states, users, fetchData }: any) => {",
  "const EditDeleteTabComponent = ({ doctors, chemists, stockists, hqs, states, users, fetchData, onEdit }: any) => {"
);

// Edit button logic
c = c.replace(
  "<button className=\"text-emerald-400 hover:text-emerald-300 hover:scale-110 transition-transform\"><Edit2 size={16} /></button>",
  "<button onClick={() => onEdit(d, filterType)} className=\"text-emerald-400 hover:text-emerald-300 hover:scale-110 transition-transform\"><Edit2 size={16} /></button>"
);

// 3. CreateDoctorTab
let createDocStart = c.indexOf("const CreateDoctorTab = () => {");
let createDocEnd = c.indexOf("  const CreateChemistTab = () => {");
let docText = c.substring(createDocStart, createDocEnd);

docText = docText.replace(
  "const CreateDoctorTab = () => {",
  "const CreateDoctorTab = ({ editData, onCancel }: { editData?: any, onCancel?: () => void }) => {"
);
docText = docText.replace(
  "const [formData, setFormData] = useState({",
  "const [formData, setFormData] = useState(editData || {"
);
docText = docText.replace(
  "const res = await axios.post('/api/admin/dcs/doctors', formData);\n        if(res.data.success) {\n          alert('Doctor added successfully');\n          fetchData();\n          setFormData({name: '', degree: '', specialization: '', hospital: '', birthday: '', anniversary: '', mobile: '', clinicContact: '', doctorCode: '', email: '', category: '', userAllotted: '', headquarter: '', workingArea: '', address: '', extraInformation: ''});\n        }",
  "if (editData) {\n          const res = await axios.put(`/api/admin/dcs/doctors/${editData._id}`, formData);\n          if(res.data.success) { alert('Doctor updated successfully'); fetchData(); if(onCancel) onCancel(); }\n        } else {\n          const res = await axios.post('/api/admin/dcs/doctors', formData);\n          if(res.data.success) { alert('Doctor added successfully'); fetchData(); setFormData({name: '', degree: '', specialization: '', hospital: '', birthday: '', anniversary: '', mobile: '', clinicContact: '', doctorCode: '', email: '', category: '', userAllotted: '', headquarter: '', workingArea: '', address: '', extraInformation: ''}); }\n        }"
);
docText = docText.replace(
  "<h2 className=\"text-lg font-bold text-white tracking-wide uppercase\">CREATE DOCTOR...</h2>",
  "<h2 className=\"text-lg font-bold text-white tracking-wide uppercase\">{editData ? `EDIT DOCTOR: ${editData.name}` : 'CREATE DOCTOR...'}</h2>"
);
docText = docText.replace(
  "<button type=\"submit\" className=\"col-span-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-xl transition-colors text-lg tracking-wider shadow-lg shadow-sky-500/20 w-full mt-4\">SUBMIT DOCTOR DETAILS</button>",
  "<div className=\"col-span-full flex gap-4 mt-4\">\n            <button type=\"submit\" className=\"flex-1 bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-xl transition-colors text-lg tracking-wider shadow-lg shadow-sky-500/20\">{editData ? 'UPDATE DOCTOR DETAILS' : 'SUBMIT DOCTOR DETAILS'}</button>\n            {editData && <button type=\"button\" onClick={onCancel} className=\"flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-colors text-lg tracking-wider\">CANCEL EDIT</button>}\n          </div>"
);

c = c.substring(0, createDocStart) + docText + c.substring(createDocEnd);


// 4. CreateChemistTab
let createChemStart = c.indexOf("const CreateChemistTab = () => {");
let createChemEnd = c.indexOf("  const CreateStockistTab = () => {");
let chemText = c.substring(createChemStart, createChemEnd);

chemText = chemText.replace(
  "const CreateChemistTab = () => {",
  "const CreateChemistTab = ({ editData, onCancel }: { editData?: any, onCancel?: () => void }) => {"
);
chemText = chemText.replace(
  "const [formData, setFormData] = useState({",
  "const [formData, setFormData] = useState(editData || {"
);
chemText = chemText.replace(
  "const res = await axios.post('/api/admin/dcs/chemists', formData);\n        if(res.data.success) {\n          alert('Chemist added successfully');\n          fetchData();\n          setFormData({businessName: '', proprietorName: '', certifications: '', birthday: '', email: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''});\n        }",
  "if (editData) {\n          const res = await axios.put(`/api/admin/dcs/chemists/${editData._id}`, formData);\n          if(res.data.success) { alert('Chemist updated successfully'); fetchData(); if(onCancel) onCancel(); }\n        } else {\n          const res = await axios.post('/api/admin/dcs/chemists', formData);\n          if(res.data.success) { alert('Chemist added successfully'); fetchData(); setFormData({businessName: '', proprietorName: '', certifications: '', birthday: '', email: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''}); }\n        }"
);
chemText = chemText.replace(
  "<h2 className=\"text-lg font-bold text-white mb-8 tracking-wide uppercase\">CREATE CHEMIST</h2>",
  "<div className=\"flex justify-between items-center mb-8\"><h2 className=\"text-lg font-bold text-white tracking-wide uppercase\">{editData ? `EDIT CHEMIST: ${editData.businessName}` : 'CREATE CHEMIST'}</h2></div>"
);
chemText = chemText.replace(
  "<button type=\"submit\" className=\"col-span-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-xl transition-colors text-lg tracking-wider shadow-lg shadow-sky-500/20 w-full mt-4\">SUBMIT CHEMIST DETAILS</button>",
  "<div className=\"col-span-full flex gap-4 mt-4\">\n            <button type=\"submit\" className=\"flex-1 bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-xl transition-colors text-lg tracking-wider shadow-lg shadow-sky-500/20\">{editData ? 'UPDATE CHEMIST DETAILS' : 'SUBMIT CHEMIST DETAILS'}</button>\n            {editData && <button type=\"button\" onClick={onCancel} className=\"flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-colors text-lg tracking-wider\">CANCEL EDIT</button>}\n          </div>"
);

c = c.substring(0, createChemStart) + chemText + c.substring(createChemEnd);


// 5. CreateStockistTab
let createStkStart = c.indexOf("const CreateStockistTab = () => {");
let createStkEnd = c.indexOf("  const UploadDCSTab = () => {");
let stkText = c.substring(createStkStart, createStkEnd);

stkText = stkText.replace(
  "const CreateStockistTab = () => {",
  "const CreateStockistTab = ({ editData, onCancel }: { editData?: any, onCancel?: () => void }) => {"
);
stkText = stkText.replace(
  "const [formData, setFormData] = useState({",
  "const [formData, setFormData] = useState(editData || {"
);
stkText = stkText.replace(
  "const res = await axios.post('/api/admin/dcs/stockists', formData);\n        if(res.data.success) {\n          alert('Stockist added successfully');\n          fetchData();\n          setFormData({businessName: '', name: '', certifications: '', email: '', gst: '', drugLicense: '', drugExpiryDate: '', establishmentDate: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''});\n        }",
  "if (editData) {\n          const res = await axios.put(`/api/admin/dcs/stockists/${editData._id}`, formData);\n          if(res.data.success) { alert('Stockist updated successfully'); fetchData(); if(onCancel) onCancel(); }\n        } else {\n          const res = await axios.post('/api/admin/dcs/stockists', formData);\n          if(res.data.success) { alert('Stockist added successfully'); fetchData(); setFormData({businessName: '', name: '', certifications: '', email: '', gst: '', drugLicense: '', drugExpiryDate: '', establishmentDate: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''}); }\n        }"
);
stkText = stkText.replace(
  "<h2 className=\"text-lg font-bold text-white mb-8 tracking-wide uppercase\">CREATE STOCKIST</h2>",
  "<div className=\"flex justify-between items-center mb-8\"><h2 className=\"text-lg font-bold text-white tracking-wide uppercase\">{editData ? `EDIT STOCKIST: ${editData.businessName}` : 'CREATE STOCKIST'}</h2></div>"
);
stkText = stkText.replace(
  "<button type=\"submit\" className=\"col-span-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-xl transition-colors text-lg tracking-wider shadow-lg shadow-sky-500/20 w-full mt-4\">SUBMIT STOCKIST DETAILS</button>",
  "<div className=\"col-span-full flex gap-4 mt-4\">\n            <button type=\"submit\" className=\"flex-1 bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-xl transition-colors text-lg tracking-wider shadow-lg shadow-sky-500/20\">{editData ? 'UPDATE STOCKIST DETAILS' : 'SUBMIT STOCKIST DETAILS'}</button>\n            {editData && <button type=\"button\" onClick={onCancel} className=\"flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-colors text-lg tracking-wider\">CANCEL EDIT</button>}\n          </div>"
);

c = c.substring(0, createStkStart) + stkText + c.substring(createStkEnd);


// 6. ManageDCS Render
c = c.replace(
  "{activeTab === 'create_doctor' && <CreateDoctorTab />}",
  "{activeTab === 'create_doctor' && <CreateDoctorTab />}"
);
c = c.replace(
  "{activeTab === 'edit_delete' && <EditDeleteTabComponent doctors={doctors} chemists={chemists} stockists={stockists} hqs={hqs} states={states} users={users} fetchData={fetchData} />}",
  "{activeTab === 'edit_delete' && !editingRecord && <EditDeleteTabComponent onEdit={(record: any, type: string) => { setEditingRecord(record); setEditingType(type); }} doctors={doctors} chemists={chemists} stockists={stockists} hqs={hqs} states={states} users={users} fetchData={fetchData} />}\n      {activeTab === 'edit_delete' && editingRecord && editingType === 'Doctor' && <CreateDoctorTab editData={editingRecord} onCancel={() => setEditingRecord(null)} />}\n      {activeTab === 'edit_delete' && editingRecord && editingType === 'Chemist' && <CreateChemistTab editData={editingRecord} onCancel={() => setEditingRecord(null)} />}\n      {activeTab === 'edit_delete' && editingRecord && editingType === 'Stockist' && <CreateStockistTab editData={editingRecord} onCancel={() => setEditingRecord(null)} />}"
);


fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', c);
console.log('Successfully patched ManageDCS to support editing via Create tabs');
