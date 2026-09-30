const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/xl/secondary-sales/save', {
      employeeId: 'TEST1',
      month: 'Sep',
      year: '2026',
      stockist: 'STK1',
      invoiceDate: '2026-09-30',
      invoiceNumber: 'INV001',
      amount: 100,
      productsData: [{ product: 'P1', qty: 10 }]
    });
    console.log(res.data);
  } catch(e) { console.error(e.response ? e.response.data : e.message); }
}
test();
