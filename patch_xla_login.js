const fs = require('fs');

// 1. Fix xl-frontend/src/pages/Login.tsx
const xlLoginFile = 'D:/MY WORK FLOW/Emyris Onboard App/xl-frontend/src/pages/Login.tsx';
let xlLogin = fs.readFileSync(xlLoginFile, 'utf8');
xlLogin = xlLogin.replace('href="/xla"', 'href="/xla/login"');
fs.writeFileSync(xlLoginFile, xlLogin);

// 2. Fix xla-frontend/src/App.tsx
const xlaAppFile = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/App.tsx';
let xlaApp = fs.readFileSync(xlaAppFile, 'utf8');
xlaApp = xlaApp.replace(
    '<Route path="/" element={<Navigate to="/dashboard" replace />} />',
    '<Route path="/" element={<Navigate to="/login" replace />} />'
);
fs.writeFileSync(xlaAppFile, xlaApp);

// 3. Fix xla-frontend/src/pages/Login.tsx
const xlaLoginFile = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/Login.tsx';
let xlaLogin = fs.readFileSync(xlaLoginFile, 'utf8');
const oldHandleLogin = `const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login for now
    if (email && password) {
      // In a real app, you would set a token here
      navigate('/dashboard');
    }
  };`;
const newHandleLogin = `const [error, setError] = useState('');
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email && password) {
      try {
        const res = await axios.post('/api/admin-login', { username: email, password });
        if (res.data.success) {
          localStorage.setItem('xla_token', 'true');
          navigate('/dashboard');
        } else {
          setError('Invalid credentials');
        }
      } catch (err) {
        setError('Invalid credentials or server error');
      }
    }
  };`;
xlaLogin = xlaLogin.replace(oldHandleLogin, newHandleLogin);

// Also need to display the error
const errorDisplay = `{error && <div className="text-rose-500 text-sm font-bold mb-4">{error}</div>}`;
xlaLogin = xlaLogin.replace('<form onSubmit={handleLogin} className="space-y-4">', `<form onSubmit={handleLogin} className="space-y-4">\n            ${errorDisplay}`);
fs.writeFileSync(xlaLoginFile, xlaLogin);

// 4. Fix xla-frontend/src/components/Layout.tsx
const xlaLayoutFile = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/Layout.tsx';
let xlaLayout = fs.readFileSync(xlaLayoutFile, 'utf8');
if (!xlaLayout.includes("localStorage.getItem('xla_token')")) {
    const authCheck = `useEffect(() => {
    if (!localStorage.getItem('xla_token')) {
      navigate('/login');
    }
  }, [navigate]);`;
    xlaLayout = xlaLayout.replace('const [logoUrl, setLogoUrl] = useState(\'\');', `const [logoUrl, setLogoUrl] = useState('');\n\n  ${authCheck}`);
    
    // Add logout functionality
    xlaLayout = xlaLayout.replace('onClick={() => navigate(\'/login\')}', 'onClick={() => { localStorage.removeItem(\'xla_token\'); navigate(\'/login\'); }}');
    
    fs.writeFileSync(xlaLayoutFile, xlaLayout);
}

console.log('Applied XLA authentication fixes');
