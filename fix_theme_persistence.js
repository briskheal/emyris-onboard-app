const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

// Replace the useState hook for isLightMode to use localStorage
const oldState = "const [isLightMode, setIsLightMode] = useState(true);";
const newState = `const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('xla_theme') === 'light';
  });

  useEffect(() => {
    localStorage.setItem('xla_theme', isLightMode ? 'light' : 'dark');
  }, [isLightMode]);`;

c = c.replace(oldState, newState);

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed theme persistence');
