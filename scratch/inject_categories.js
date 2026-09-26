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
      
      const categories = [...new Set(products.map(p => p.category || 'Uncategorized'))];

      hqUsers.forEach(u => {
        let grandTotalRows = [];

        categories.forEach(cat => {
          const catProducts = products.filter(p => (p.category || 'Uncategorized') === cat);
          if (catProducts.length === 0) return;

          wsData.push(['', '', \`--- \${cat.toUpperCase()} ---\`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
          
          const startRow = wsData.length + 1; // 1-indexed

          catProducts.forEach(p => {
            wsData.push([
              u.uid, u.firstName + ' ' + (u.lastName || ''), p.productName, p.ptr, p.pts, p.mrp, p.pts, p.uid,
              '', '', '', '', '', '', '', '', '', '', '', ''
            ]);
          });

          const endRow = wsData.length;

          let subtotalRow = ['', '', \`\${cat.toUpperCase()} TOTAL\`, '', '', '', '', ''];
          const cols = ['I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
          cols.forEach(c => {
            subtotalRow.push({ f: \`SUMPRODUCT(\${c}\${startRow}:\${c}\${endRow}, G\${startRow}:G\${endRow})\` });
          });
          wsData.push(subtotalRow);
          
          grandTotalRows.push(wsData.length);
          wsData.push([]); // visual spacing
        });

        // Grand Total Row
        let grandTotalRow = ['', '', 'GRAND TOTAL BUDGET', '', '', '', '', ''];
        const cols = ['I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
        cols.forEach(c => {
           const f = grandTotalRows.map(r => \`\${c}\${r}\`).join('+');
           grandTotalRow.push({ f: f || '0' });
        });
        wsData.push(grandTotalRow);
      });
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
console.log('Fixed formulas with categories!');
