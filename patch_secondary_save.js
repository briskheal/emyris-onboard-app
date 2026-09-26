const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/SecondarySales.tsx', 'utf8');

const oldHandleSave = `      try {
        const payload = {
          ...formData,
          productsData: validRows,
          employeeId: user.employeeId || user._id || 'ADMIN'
        };
  
        let res;
          if (id) {
              res = await axios.put('/api/xl/secondary-sales/update/' + id, payload);
          } else {
              res = await axios.post('/api/xl/secondary-sales/save', payload);
          }
        if (res.data.success) {
          alert(id ? 'Secondary Sales updated successfully!' : 'Secondary Sales saved successfully!');
          if (id) {
              navigate('/extras/secondary/all');
          } else {
              setFormData({`;

const newHandleSave = `      try {
        const payload: any = {
          ...formData,
          productsData: validRows,
          employeeId: user.employeeId || user._id || 'ADMIN'
        };
  
        let res;
          if (id) {
              payload.status = 'Approved';
              res = await axios.put('/api/xl/secondary-sales/update/' + id, payload);
          } else {
              res = await axios.post('/api/xl/secondary-sales/save', payload);
          }
        if (res.data.success) {
          alert(id ? 'Secondary Sales updated successfully!' : 'Secondary Sales saved successfully!');
          if (id) {
              navigate(-1);
          } else {
              setFormData({`;

f = f.replace(oldHandleSave, newHandleSave);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/SecondarySales.tsx', f);
console.log('Patched SecondarySales.tsx handleSave logic');
