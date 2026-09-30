const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

if (!c.includes('const userStr =')) {
  c = c.replace(/const \[selectedYear\] = useState\('2026'\);/, 'const [selectedYear] = useState(\'2026\');\n  const userStr = localStorage.getItem(\'xla_user\');\n  const user = userStr ? JSON.parse(userStr) : null;\n  const userName = user?.name || user?.firstName || user?.businessName || \'User\';');
}

c = c.replace(/src="https:\/\/ui-avatars\.com\/api\/\?name=Jnana&background=0D8ABC&color=fff"/g, 'src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`}');

c = c.replace(/<span className="text-sm font-medium text-slate-200 hidden sm:block">Jnana<\/span>/g, '<span className="text-sm font-medium text-slate-200 hidden sm:block">{userName}</span>');

c = c.replace(/Hi Jnana, glad to see you again/g, 'Hi {userName}, glad to see you again');

c = c.replace(/src="https:\/\/ui-avatars\.com\/api\/\?name=Jnana\+Dash&background=0D8ABC&color=fff"/g, 'src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`}');

c = c.replace(/<span className="font-semibold text-xs leading-none text-slate-200">Jnana Dash<\/span>/g, '<span className="font-semibold text-xs leading-none text-slate-200">{userName}</span>');

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('User names made dynamic');
