const dns = require('dns');
dns.resolveSrv('_mongodb._tcp.cluster0.cquys3i.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('SRV Resolve Error:', err);
  } else {
    console.log('SRV Addresses:', addresses);
  }
});
