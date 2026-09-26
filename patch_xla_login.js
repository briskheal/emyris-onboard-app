const fs = require('fs');
const path = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/Login.tsx';
let c = fs.readFileSync(path, 'utf8');

const oldLoginHandler = `  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login for now
    if (email && password) {
      // In a real app, you would set a token here
      navigate('/dashboard');
    }
  };`;

const newLoginHandler = `  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      try {
        const res = await axios.post('/api/xl/admin-login', { email, password });
        if (res.data.success) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          localStorage.setItem('xl_token', res.data.token);
          navigate('/dashboard');
        } else {
          alert(res.data.message || 'Invalid credentials');
        }
      } catch (err) {
        console.error(err);
        alert('Login failed. Server error.');
      }
    }
  };`;

c = c.replace(oldLoginHandler, newLoginHandler);
fs.writeFileSync(path, c);
console.log('XLA Admin Login patched to use real backend authentication.');
