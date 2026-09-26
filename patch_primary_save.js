const fs = require('fs');
let f = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/PrimarySales.tsx', 'utf8');

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
          alert(id ? 'Invoice updated successfully!' : 'Invoice saved successfully!');
          if (id) {
              navigate('/extras/primary-sales/all');
          } else {
              setFormData({
                  date: new Date().toISOString().split('T')[0],
                  invoiceDate: new Date().toISOString().split('T')[0],
                  invoiceNumber: '',
                  division: formData.division || '',
                  headquarter: formData.headquarter || '',
                  stockist: ''
              });
              setRows([{ id: Date.now(), productId: '', purcRtn: '', quantity: '', freeStocks: '', discount: '', customPrice: '', selectedPriceType: 'PTS', customRtnPrice: '', selectedRtnPriceType: 'PTS', isExpiry: false }]);
          }
        } else {
          alert('Failed to save invoice.');
        }
      } catch (err) {
        console.error(err);
        alert('An error occurred while saving.');
      }`;

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
          alert(id ? 'Invoice updated successfully!' : 'Invoice saved successfully!');
          if (id) {
              navigate(-1);
          } else {
              setFormData({
                  date: new Date().toISOString().split('T')[0],
                  invoiceDate: new Date().toISOString().split('T')[0],
                  invoiceNumber: '',
                  division: formData.division || '',
                  headquarter: formData.headquarter || '',
                  stockist: ''
              });
              setRows([{ id: Date.now(), productId: '', purcRtn: '', quantity: '', freeStocks: '', discount: '', customPrice: '', selectedPriceType: 'PTS', customRtnPrice: '', selectedRtnPriceType: 'PTS', isExpiry: false }]);
          }
        } else {
          alert('Failed to save invoice.');
        }
      } catch (err) {
        console.error(err);
        alert('An error occurred while saving.');
      }`;

f = f.replace(oldHandleSave, newHandleSave);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/PrimarySales.tsx', f);
console.log('Patched PrimarySales.tsx handleSave logic');
