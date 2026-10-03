const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageDCS.tsx', 'utf8');

// 1. Fix handleSubmit for Doctor
c = c.replace(
  /const handleSubmit = async \(e: React\.FormEvent\) => \{\s+e\.preventDefault\(\);\s+setLoading\(true\);\s+try \{\s+const res = await axios\.post\('\/api\/admin\/dcs\/doctors', formData\);\s+if\(res\.data\.success\) \{\s+alert\('Doctor added successfully'\);\s+fetchData\(\);\s+setFormData\(\{name: '', degree: '', specialization: '', hospital: '', birthday: '', anniversary: '', mobile: '', clinicContact: '', doctorCode: '', email: '', category: '', userAllotted: '', headquarter: '', workingArea: '', address: '', extraInformation: ''\}\);\s+\}\s+\} catch \(e\) \{ alert\('Error adding doctor'\); \} finally \{ setLoading\(false\); \}\s+\};/s,
  `const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        if (editData) {
          const res = await axios.put(\`/api/admin/dcs/doctors/\${editData._id}\`, formData);
          if(res.data.success) { alert('Doctor updated successfully'); fetchData(); if(onCancel) onCancel(); }
        } else {
          const res = await axios.post('/api/admin/dcs/doctors', formData);
          if(res.data.success) { alert('Doctor added successfully'); fetchData(); setFormData({name: '', degree: '', specialization: '', hospital: '', birthday: '', anniversary: '', mobile: '', clinicContact: '', doctorCode: '', email: '', category: '', userAllotted: '', headquarter: '', workingArea: '', address: '', extraInformation: ''}); }
        }
      } catch (e: any) { alert(editData ? 'Error updating doctor: ' + (e.response?.data?.message || e.message) : 'Error adding doctor'); } finally { setLoading(false); }
    };`
);

// 2. Fix handleSubmit for Chemist
c = c.replace(
  /const handleSubmit = async \(e: React\.FormEvent\) => \{\s+e\.preventDefault\(\);\s+setLoading\(true\);\s+try \{\s+const res = await axios\.post\('\/api\/admin\/dcs\/chemists', formData\);\s+if\(res\.data\.success\) \{\s+alert\('Chemist added successfully'\);\s+fetchData\(\);\s+setFormData\(\{businessName: '', proprietorName: '', certifications: '', birthday: '', email: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''\}\);\s+\}\s+\} catch \(e\) \{ alert\('Error adding chemist'\); \} finally \{ setLoading\(false\); \}\s+\};/s,
  `const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        if (editData) {
          const res = await axios.put(\`/api/admin/dcs/chemists/\${editData._id}\`, formData);
          if(res.data.success) { alert('Chemist updated successfully'); fetchData(); if(onCancel) onCancel(); }
        } else {
          const res = await axios.post('/api/admin/dcs/chemists', formData);
          if(res.data.success) { alert('Chemist added successfully'); fetchData(); setFormData({businessName: '', proprietorName: '', certifications: '', birthday: '', email: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''}); }
        }
      } catch (e: any) { alert(editData ? 'Error updating chemist: ' + (e.response?.data?.message || e.message) : 'Error adding chemist'); } finally { setLoading(false); }
    };`
);

// 3. Fix handleSubmit for Stockist
c = c.replace(
  /const handleSubmit = async \(e: React\.FormEvent\) => \{\s+e\.preventDefault\(\);\s+setLoading\(true\);\s+try \{\s+const res = await axios\.post\('\/api\/admin\/dcs\/stockists', formData\);\s+if\(res\.data\.success\) \{\s+alert\('Stockist added successfully'\);\s+fetchData\(\);\s+setFormData\(\{businessName: '', name: '', certifications: '', email: '', gst: '', drugLicense: '', drugExpiryDate: '', establishmentDate: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''\}\);\s+\}\s+\} catch \(e\) \{ alert\('Error adding stockist'\); \} finally \{ setLoading\(false\); \}\s+\};/s,
  `const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        if (editData) {
          const res = await axios.put(\`/api/admin/dcs/stockists/\${editData._id}\`, formData);
          if(res.data.success) { alert('Stockist updated successfully'); fetchData(); if(onCancel) onCancel(); }
        } else {
          const res = await axios.post('/api/admin/dcs/stockists', formData);
          if(res.data.success) { alert('Stockist added successfully'); fetchData(); setFormData({businessName: '', name: '', certifications: '', email: '', gst: '', drugLicense: '', drugExpiryDate: '', establishmentDate: '', mobile: '', userAllotted: '', address: '', headquarter: '', workingArea: '', extraInformation: ''}); }
        }
      } catch (e: any) { alert(editData ? 'Error updating stockist: ' + (e.response?.data?.message || e.message) : 'Error adding stockist'); } finally { setLoading(false); }
    };`
);

// 4. Change type="email" to type="text" globally to remove HTML5 validation blocks
c = c.replace(/type="email"/g, 'type="text"');

// 5. Remove 'required' from 'userAllotted' select dropdowns so backend validation applies instead of strict frontend blocks
c = c.replace(/<select required value=\{formData\.userAllotted\}/g, '<select value={formData.userAllotted}');

fs.writeFileSync('xla-frontend/src/pages/ManageDCS.tsx', c);
console.log('Fixed DCS logic using robust regex replacement!');
