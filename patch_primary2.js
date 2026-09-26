const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/PrimarySales.tsx', 'utf8');

// 1. Fix Back Button
f = f.replace(
  "onClick={() => id ? navigate('/extras/primary-sales/all') : navigate('/')}",
  "onClick={() => navigate(-1)}"
);

// 2. Fix HQ Mapping
const oldHQMapping = `          let hq = d.headquarter || '';
          // Ensure exact string match for HQ if needed, though mobile usually passes uppercase.
          
          setFormData({`;

const newHQMapping = `          let hq = d.headquarter || '';
          if (hq) {
             const matchingHq = hqs.find((h: any) => h.value.toLowerCase() === hq.toLowerCase() || h.label.toLowerCase() === hq.toLowerCase());
             if (matchingHq) hq = matchingHq.value;
          }
          
          setFormData({`;
f = f.replace(oldHQMapping, newHQMapping);

// 3. Fix handleSave to send status and navigate(-1)
const oldHandleSave = `      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        
        const payload = {
          ...formData,
          employeeId: user.employeeId || user._id || 'ADMIN',
          grossInvValue: totals.grossInvValue,
            netInvValue: totals.netInvValue,
            salableRtnValue: totals.salableRtnValue,
            expiryRtnValue: totals.expiryRtnValue,
          productsData: validRows
        };
  
        let res;
          if (id) {
              res = await axios.put('/api/xl/primary-sales/update/' + id, payload);
          } else {
              res = await axios.post('/api/xl/primary-sales/save', payload);
          }
        if (res.data.success) {
          alert('Primary Sales invoice saved successfully!');
          id ? navigate('/extras/primary-sales/all') : navigate('/');
        } else {`;

const newHandleSave = `      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        
        const payload: any = {
          ...formData,
          employeeId: user.employeeId || user._id || 'ADMIN',
          grossInvValue: totals.grossInvValue,
            netInvValue: totals.netInvValue,
            salableRtnValue: totals.salableRtnValue,
            expiryRtnValue: totals.expiryRtnValue,
          productsData: validRows
        };
  
        let res;
          if (id) {
              payload.status = 'Approved';
              res = await axios.put('/api/xl/primary-sales/update/' + id, payload);
          } else {
              res = await axios.post('/api/xl/primary-sales/save', payload);
          }
        if (res.data.success) {
          alert('Primary Sales invoice saved successfully!');
          navigate(-1);
        } else {`;

f = f.replace(oldHandleSave, newHandleSave);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/PrimarySales.tsx', f);
console.log('Patched PrimarySales.tsx');
