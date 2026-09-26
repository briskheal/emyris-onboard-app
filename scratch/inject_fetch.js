const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/ManageUsers.tsx', 'utf8');

const injectionCode = `
  // Auto-fetch existing target when user/month/year changes
  useEffect(() => {
    if (!targetUser || !selectedMonth || !selectedYear || products.length === 0) return;
    
    const fetchExistingTarget = async () => {
      try {
        const res = await axios.get('/api/admin/targets?month=' + selectedMonth + '&year=' + selectedYear);
        if (res.data.success) {
          const target = res.data.targets.find((t: any) => t.employeeId === targetUser.uid);
          
          if (target) {
            setTargetType(target.allocationType || 'Select...');
            if (target.allocationType === 'Lump-Sum') {
              setLumpSumAmount((target.lumpSumAmount || 0).toString());
            } else {
              setLumpSumAmount('');
            }
            
            let dbProductTargets = target.productTargets || [];
            if (typeof dbProductTargets === 'string') {
                try { dbProductTargets = JSON.parse(dbProductTargets); } catch(e) { dbProductTargets = []; }
            }
            
            const mapped = products.map(p => {
              const ex = dbProductTargets.find((tp: any) => tp.productId === p._id || tp.productId === p.uid);
              if (ex) {
                let guessedPriceType = ex.priceType || 'Custom';
                if (!ex.priceType && ex.price !== undefined) {
                  if (ex.price == p.pts) guessedPriceType = 'PTS';
                  else if (ex.price == p.ptr) guessedPriceType = 'PTR';
                  else if (ex.price == p.mrp) guessedPriceType = 'MRP';
                }
                
                return {
                  productId: p._id,
                  productName: p.productName,
                  ptr: p.ptr || 0,
                  mrp: p.mrp || 0,
                  pts: p.pts || 0,
                  priceType: guessedPriceType,
                  customPrice: ex.customPrice !== undefined ? ex.customPrice : (ex.price || 0),
                  qty: ex.qty || '',
                  amount: ex.total !== undefined ? ex.total : (ex.amount || 0)
                };
              }
              return {
                productId: p._id,
                productName: p.productName,
                ptr: p.ptr || 0,
                mrp: p.mrp || 0,
                pts: p.pts || 0,
                priceType: 'PTR',
                customPrice: 0,
                qty: '',
                amount: 0
              };
            });
            setProductTargets(mapped);
          } else {
            // Reset to defaults
            setTargetType('Select...');
            setLumpSumAmount('');
            setProductTargets(products.map(p => ({
              productId: p._id,
              productName: p.productName,
              ptr: p.ptr || 0,
              mrp: p.mrp || 0,
              pts: p.pts || 0,
              priceType: 'PTR',
              customPrice: 0,
              qty: '',
              amount: 0
            })));
          }
        }
      } catch (e) {
        console.error('Error fetching existing targets', e);
      }
    };
    fetchExistingTarget();
  }, [targetUser, selectedMonth, selectedYear, products]);`;

c = c.replace(
  'const handleOpenTargetForm = (user: any) => {',
  injectionCode + '\n\n  const handleOpenTargetForm = (user: any) => {'
);

fs.writeFileSync('xla-frontend/src/pages/ManageUsers.tsx', c);
console.log('Injected auto-fetch useEffect for SetTargetTab');
