const fs = require('fs');

const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/SecondarySalesForm.tsx';
let code = fs.readFileSync(path, 'utf8');

const handlePriceTypeOld = `const handlePriceTypeChange = (index: number, type: string) => {
    setProductsData(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], priceType: type };
      
      const prodName = newRows[index].product;
      const pData = productsMaster.find((p:any) => (p.productName || p.name) === prodName);
      if (pData) {
        if (type === 'PTR') newRows[index].basePrice = pData.ptr || 0;
        else if (type === 'PTS') newRows[index].basePrice = pData.pts || 0;
        else if (type === 'MRP') newRows[index].basePrice = pData.mrp || 0;
        else if (type === 'CUS') newRows[index].basePrice = '';
      } else {
        // Fallback for custom logic if product master is missing
        if (type === 'CUS') newRows[index].basePrice = '';
      }
      return newRows;
    });
  };`;

const handlePriceTypeNew = `const handlePriceTypeChange = (index: number, type: string) => {
    setProductsData(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], priceType: type };
      
      const prodName = newRows[index].product;
      // Search by productName, name, uid, OR _id! (Because auto-populated products use the ID)
      const pData = productsMaster.find((p:any) => 
        (p.productName || p.name) === prodName || 
        p.uid === prodName || 
        p._id === prodName
      );
      
      if (pData) {
        if (type === 'PTR') newRows[index].basePrice = pData.ptr || 0;
        else if (type === 'PTS') newRows[index].basePrice = pData.pts || 0;
        else if (type === 'MRP') newRows[index].basePrice = pData.mrp || 0;
        else if (type === 'CUS') newRows[index].basePrice = '';
      } else {
        // Fallback if product master is missing for some reason
        if (type === 'CUS') newRows[index].basePrice = '';
      }
      return newRows;
    });
  };`;

// Try replacing, but since I added the fallback to the "old" string, it might not match. Let's use Regex for safety.
const regex = /const handlePriceTypeChange = \(index: number, type: string\) => \{[\s\S]*?return newRows;\s*\}\);\s*\};/;
code = code.replace(regex, handlePriceTypeNew);

fs.writeFileSync(path, code);
console.log("SecondarySalesForm patched for ID-based product matching in handlePriceTypeChange.");
