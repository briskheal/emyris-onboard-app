const fs = require('fs');

const path = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/creation/SecondarySalesForm.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Fix auto-populate to map basePrice correctly and add productsMaster to deps
const autoPopulateOld = `// Handle Autopopulate when month/year/stockist change (only if NEW)
  useEffect(() => {
    if (!editId && header.stockist && header.month && header.year) {
      axios.get(\`/api/xl/secondary-sales-data/auto-populate?stockist=\${header.stockist}&month=\${header.month}&year=\${header.year}\`)
        .then(res => {
          if (res.data.success && res.data.data.length > 0) {
            const mapped = res.data.data.map((item: any) => ({
              id: Date.now() + Math.random(),
              product: item.productId,
              basePrice: '',
              priceType: 'PTR',
              openingQty: item.openingQty || 0,
              receivedQty: item.receivedQty || 0,
              salesQty: '',
              free: '',
              closingQty: (item.openingQty || 0) + (item.receivedQty || 0)
            }));
            setProductsData(mapped);
          } else {
            setProductsData([]);
          }
        });
    }
  }, [header.stockist, header.month, header.year, editId]);`;

const autoPopulateNew = `// Handle Autopopulate when month/year/stockist change (only if NEW)
  useEffect(() => {
    if (!editId && header.stockist && header.month && header.year) {
      axios.get(\`/api/xl/secondary-sales-data/auto-populate?stockist=\${header.stockist}&month=\${header.month}&year=\${header.year}\`)
        .then(res => {
          if (res.data.success && res.data.data.length > 0) {
            const mapped = res.data.data.map((item: any) => {
              const pData = productsMaster.find((p:any) => (p.productName || p.name) === item.productId || p.uid === item.productId || p._id === item.productId);
              return {
                id: Date.now() + Math.random(),
                product: item.productId,
                basePrice: pData ? (pData.ptr || '') : '',
                priceType: 'PTR',
                openingQty: item.openingQty || 0,
                receivedQty: item.receivedQty || 0,
                salesQty: '',
                free: '',
                closingQty: (item.openingQty || 0) + (item.receivedQty || 0)
              };
            });
            setProductsData(mapped);
          } else {
            setProductsData([]);
          }
        });
    }
  }, [header.stockist, header.month, header.year, editId, productsMaster]);`;

code = code.replace(autoPopulateOld, autoPopulateNew);


// 2. Fix handleRowChange to use functional state updates to prevent race conditions
const handleRowChangeOld = `const handleRowChange = (index: number, field: string, value: any) => {
    const newRows = [...productsData];
    newRows[index][field] = value;
    
    if (['openingQty', 'receivedQty', 'salesQty', 'free'].includes(field)) {
      const op = Number(newRows[index].openingQty) || 0;
      const rec = Number(newRows[index].receivedQty) || 0;
      const sales = Number(newRows[index].salesQty) || 0;
      const free = Number(newRows[index].free) || 0;
      newRows[index].closingQty = (op + rec) - (sales + free);
    }
    setProductsData(newRows);
  };`;

const handleRowChangeNew = `const handleRowChange = (index: number, field: string, value: any) => {
    setProductsData(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value };
      
      if (['openingQty', 'receivedQty', 'salesQty', 'free'].includes(field)) {
        const op = Number(newRows[index].openingQty) || 0;
        const rec = Number(newRows[index].receivedQty) || 0;
        const sales = Number(newRows[index].salesQty) || 0;
        const free = Number(newRows[index].free) || 0;
        newRows[index].closingQty = (op + rec) - (sales + free);
      }
      return newRows;
    });
  };`;

code = code.replace(handleRowChangeOld, handleRowChangeNew);


// 3. Fix selectProductForRow to do it all in one batch update
const selectProductOld = `const selectProductForRow = (index: number, prodName: string) => {
    handleRowChange(index, 'product', prodName);
    
    const pData = productsMaster.find((p:any) => (p.productName || p.name) === prodName);
    if (pData) {
      const type = productsData[index].priceType;
      if (type === 'PTR') handleRowChange(index, 'basePrice', pData.ptr || 0);
      else if (type === 'PTS') handleRowChange(index, 'basePrice', pData.pts || 0);
      else if (type === 'MRP') handleRowChange(index, 'basePrice', pData.mrp || 0);
    }
    
    fetchRowStock(prodName, index);
  };`;

const selectProductNew = `const selectProductForRow = (index: number, prodName: string) => {
    const pData = productsMaster.find((p:any) => (p.productName || p.name) === prodName);
    
    setProductsData(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], product: prodName };
      
      if (pData) {
        const type = newRows[index].priceType;
        if (type === 'PTR') newRows[index].basePrice = pData.ptr || 0;
        else if (type === 'PTS') newRows[index].basePrice = pData.pts || 0;
        else if (type === 'MRP') newRows[index].basePrice = pData.mrp || 0;
      }
      return newRows;
    });
    
    fetchRowStock(prodName, index);
  };`;

code = code.replace(selectProductOld, selectProductNew);


// 4. Fix handlePriceTypeChange to do it in one batch update
const handlePriceTypeOld = `const handlePriceTypeChange = (index: number, type: string) => {
    handleRowChange(index, 'priceType', type);
    const prodName = productsData[index].product;
    const pData = productsMaster.find((p:any) => (p.productName || p.name) === prodName);
    if (pData) {
      if (type === 'PTR') handleRowChange(index, 'basePrice', pData.ptr || 0);
      else if (type === 'PTS') handleRowChange(index, 'basePrice', pData.pts || 0);
      else if (type === 'MRP') handleRowChange(index, 'basePrice', pData.mrp || 0);
      else if (type === 'CUS') handleRowChange(index, 'basePrice', '');
    }
  };`;

const handlePriceTypeNew = `const handlePriceTypeChange = (index: number, type: string) => {
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
      }
      return newRows;
    });
  };`;

code = code.replace(handlePriceTypeOld, handlePriceTypeNew);

// 5. Fix fetchRowStock to use functional updates
const fetchRowStockOld = `const fetchRowStock = async (productName: string, index: number) => {
    if (!productName || !header.stockist || !header.month || !header.year) return;
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mIdx = months.indexOf(header.month);
    let prevMonth = '', prevYear = header.year;
    if (mIdx === 0) { prevMonth = "Dec"; prevYear = (parseInt(header.year) - 1).toString(); }
    else if (mIdx > 0) { prevMonth = months[mIdx - 1]; }
    
    try {
      const [obRes, prRes] = await Promise.all([
        axios.get(\`/api/xl/secondary-sales-data/opening-balance?stockist=\${header.stockist}&prevMonth=\${prevMonth}&prevYear=\${prevYear}&productId=\${productName}\`),
        axios.get(\`/api/xl/secondary-sales-data/primary-received?stockist=\${header.stockist}&month=\${header.month}&year=\${header.year}&productId=\${productName}\`)
      ]);
      
      const opQty = obRes.data.openingQty || 0;
      const recQty = prRes.data.receivedQty || 0;
      
      const newRows = [...productsData];
      if (newRows[index]) {
        newRows[index].openingQty = opQty;
        newRows[index].receivedQty = recQty;
        const total = opQty + recQty;
        newRows[index].closingQty = total - (Number(newRows[index].salesQty) || 0) - (Number(newRows[index].free) || 0);
        setProductsData(newRows);
      }
    } catch(e) {}
  };`;

const fetchRowStockNew = `const fetchRowStock = async (productName: string, index: number) => {
    if (!productName || !header.stockist || !header.month || !header.year) return;
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mIdx = months.indexOf(header.month);
    let prevMonth = '', prevYear = header.year;
    if (mIdx === 0) { prevMonth = "Dec"; prevYear = (parseInt(header.year) - 1).toString(); }
    else if (mIdx > 0) { prevMonth = months[mIdx - 1]; }
    
    try {
      const [obRes, prRes] = await Promise.all([
        axios.get(\`/api/xl/secondary-sales-data/opening-balance?stockist=\${header.stockist}&prevMonth=\${prevMonth}&prevYear=\${prevYear}&productId=\${productName}\`),
        axios.get(\`/api/xl/secondary-sales-data/primary-received?stockist=\${header.stockist}&month=\${header.month}&year=\${header.year}&productId=\${productName}\`)
      ]);
      
      const opQty = obRes.data.openingQty || 0;
      const recQty = prRes.data.receivedQty || 0;
      
      setProductsData(prev => {
        const newRows = [...prev];
        if (newRows[index]) {
          newRows[index] = { ...newRows[index], openingQty: opQty, receivedQty: recQty };
          const total = opQty + recQty;
          newRows[index].closingQty = total - (Number(newRows[index].salesQty) || 0) - (Number(newRows[index].free) || 0);
        }
        return newRows;
      });
    } catch(e) {}
  };`;

code = code.replace(fetchRowStockOld, fetchRowStockNew);

fs.writeFileSync(path, code);
console.log("SecondarySalesForm patched for price auto-fetching and race conditions.");
