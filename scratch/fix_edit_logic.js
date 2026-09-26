const fs = require('fs');

let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

// DOCTOR
c = c.replace(
  "const res = await axios.post('/api/admin/dcs/doctors', formData);\n        if(res.data.success) {\n          alert('Doctor added successfully');\n          fetchData();\n          setFormData({name: '', degree: '', specialization: '', hospital: '', birthday: '', anniversary: '', mobile: '', clinicContact: '', doctorCode: '', email: '', category: '', userAllotted: '', headquarter: '', workingArea: '', address: '', extraInformation: ''});\n        }",
  "if (editData) {\n          const res = await axios.put(`/api/admin/dcs/doctors/${editData._id}`, formData);\n          if(res.data.success) { alert('Doctor updated successfully'); fetchData(); if(onCancel) onCancel(); }\n        } else {\n          const res = await axios.post('/api/admin/dcs/doctors', formData);\n          if(res.data.success) { alert('Doctor added successfully'); fetchData(); setFormData({name: '', degree: '', specialization: '', hospital: '', birthday: '', anniversary: '', mobile: '', clinicContact: '', doctorCode: '', email: '', category: '', userAllotted: '', headquarter: '', workingArea: '', address: '', extraInformation: ''}); }\n        }"
);
c = c.replace(
  "<div><button disabled={loading} className=\"bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors\">Add Doctor</button></div>",
  "<div className=\"flex gap-4\">\n            <button type=\"submit\" disabled={loading} className=\"bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors\">{editData ? 'Update Doctor' : 'Add Doctor'}</button>\n            {editData && <button type=\"button\" onClick={onCancel} className=\"bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg transition-colors\">Cancel Edit</button>}\n          </div>"
);

// CHEMIST
c = c.replace(
  "const res = await axios.post('/api/admin/dcs/chemists', formData);\n        if(res.data.success) {\n          alert('Chemist added successfully');\n          fetchData();\n          setFormData({businessName: '', proprietorName: '', certifications: '', birthday: '', email: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''});\n        }",
  "if (editData) {\n          const res = await axios.put(`/api/admin/dcs/chemists/${editData._id}`, formData);\n          if(res.data.success) { alert('Chemist updated successfully'); fetchData(); if(onCancel) onCancel(); }\n        } else {\n          const res = await axios.post('/api/admin/dcs/chemists', formData);\n          if(res.data.success) { alert('Chemist added successfully'); fetchData(); setFormData({businessName: '', proprietorName: '', certifications: '', birthday: '', email: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''}); }\n        }"
);
c = c.replace(
  "<div><button disabled={loading} className=\"bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors\">Add Chemist</button></div>",
  "<div className=\"flex gap-4\">\n            <button type=\"submit\" disabled={loading} className=\"bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors\">{editData ? 'Update Chemist' : 'Add Chemist'}</button>\n            {editData && <button type=\"button\" onClick={onCancel} className=\"bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg transition-colors\">Cancel Edit</button>}\n          </div>"
);


// STOCKIST
c = c.replace(
  "const res = await axios.post('/api/admin/dcs/stockists', formData);\n        if(res.data.success) {\n          alert('Stockist added successfully');\n          fetchData();\n          setFormData({businessName: '', name: '', certifications: '', email: '', gst: '', drugLicense: '', drugExpiryDate: '', establishmentDate: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''});\n        }",
  "if (editData) {\n          const res = await axios.put(`/api/admin/dcs/stockists/${editData._id}`, formData);\n          if(res.data.success) { alert('Stockist updated successfully'); fetchData(); if(onCancel) onCancel(); }\n        } else {\n          const res = await axios.post('/api/admin/dcs/stockists', formData);\n          if(res.data.success) { alert('Stockist added successfully'); fetchData(); setFormData({businessName: '', name: '', certifications: '', email: '', gst: '', drugLicense: '', drugExpiryDate: '', establishmentDate: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''}); }\n        }"
);
c = c.replace(
  "<div><button disabled={loading} className=\"bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors\">Add Stockist</button></div>",
  "<div className=\"flex gap-4\">\n            <button type=\"submit\" disabled={loading} className=\"bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg transition-colors\">{editData ? 'Update Stockist' : 'Add Stockist'}</button>\n            {editData && <button type=\"button\" onClick={onCancel} className=\"bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg transition-colors\">Cancel Edit</button>}\n          </div>"
);


fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', c);
console.log('Fixed edit submit logic');
