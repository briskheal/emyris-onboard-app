const fs = require('fs');

const file = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/Login.tsx';
let content = fs.readFileSync(file, 'utf8');

const startMarker = "const handleLogin = (e: React.FormEvent) => {";
const endMarker = "};";
let startIndex = content.indexOf(startMarker);
if (startIndex !== -1) {
    let endIndex = content.indexOf(endMarker, startIndex);
    if (endIndex !== -1) {
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
        content = content.substring(0, startIndex) + newHandleLogin + content.substring(endIndex + 2);
        
        // Add error display inside form if not present
        if (!content.includes('{error &&')) {
            content = content.replace('<form onSubmit={handleLogin}', '{error && <div className="text-rose-500 text-sm font-bold mb-4 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</div>}\n          <form onSubmit={handleLogin}');
        }
        
        fs.writeFileSync(file, content);
        console.log("Patched xla-frontend/src/pages/Login.tsx successfully!");
    }
} else {
    console.log("Could not find start marker in Login.tsx");
}
