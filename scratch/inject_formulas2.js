const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const replaceStr = `let wsData = [];
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
    }`;

const startIdx = c.indexOf('let wsData = [];');
const endIdx = c.indexOf('const wb = XLSX.utils.book_new();');

c = c.substring(0, startIdx) + replaceStr + '\n\n    const wb = XLSX.utils.book_new();' + c.substring(endIdx + 33);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Fixed formulas easily');
