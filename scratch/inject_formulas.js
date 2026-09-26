const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const funcStart = c.indexOf('const handleDownloadFormat = () => {');
const funcEndStr = `XLSX.writeFile(wb, \`Target_Upload_Format_\${selectedHq.replace(/\\s+/g, '_')}.xlsx\`);\n  };`;
const funcEnd = c.indexOf(funcEndStr) + funcEndStr.length;

const newFunc = `const handleDownloadFormat = () => {
    if (targetType === 'Select...') {
      alert('Please select a Target Type first.');
      return;
    }
    if (!selectedHq) {
      alert('Please select an HQ first to download the HQ-wise format.');
      return;
    }

    const hqUsers = users.filter(u => {
      const hqObj = hqs.find(h => h.hqName === selectedHq);
      return u.hq === selectedHq || (hqObj && u.hq === hqObj.uid);
    });

    if (hqUsers.length === 0) {
      alert('No users found in this HQ.');
      return;
    }

    let wsData = [];
    if (targetType === 'Lump-Sum') {
      wsData.push(['Employee UID', 'Employee Name', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March']);
      hqUsers.forEach(u => {
        wsData.push([u.uid, u.firstName + ' ' + (u.lastName || ''), '', '', '', '', '', '', '', '', '', '', '', '']);
      });

      const rowCount = wsData.length;
      wsData.push([]);
      let totalRow = ['TOTAL BUDGET (Auto-Calc)', ''];
      const cols = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
      cols.forEach(c => {
        totalRow.push({ f: \`SUM(\${c}2:\${c}\${rowCount})\` });
      });
      wsData.push(totalRow);
    } else {
      wsData.push([
        'Employee UID', 'Employee Name', 'productName', 'ptr', 'pts', 'mrp', 'cus', 'uid',
        'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'
      ]);
      
      hqUsers.forEach(u => {
        products.forEach(p => {
          wsData.push([
            u.uid, u.firstName + ' ' + (u.lastName || ''), p.productName, p.ptr, p.pts, p.mrp, p.pts, p.uid,
            '', '', '', '', '', '', '', '', '', '', '', ''
          ]);
        });
      });

      const rowCount = wsData.length;
      wsData.push([]);
      let totalRow = ['TOTAL BUDGET (Auto-Calc)', '', '', '', '', '', '', ''];
      const cols = ['I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
      cols.forEach(c => {
        totalRow.push({ f: \`SUMPRODUCT(\${c}2:\${c}\${rowCount}, G2:G\${rowCount})\` });
      });
      wsData.push(totalRow);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Hide uid column for Qty*Amount and format widths
    if (targetType !== 'Lump-Sum') {
      ws['!cols'] = [
        { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { hidden: true }
      ];
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Target Format');
    XLSX.writeFile(wb, \`Target_Upload_Format_\${selectedHq.replace(/\\s+/g, '_')}.xlsx\`);
  };`;

c = c.substring(0, funcStart) + newFunc + c.substring(funcEnd);
fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Successfully injected Excel formulas and hidden UID column');
