const fs = require('fs');

// 1. Add emergency route to server.js instead of routes/xl.js
const serverFile = 'D:/MY WORK FLOW/Emyris Onboard App/server.js';
let server = fs.readFileSync(serverFile, 'utf8');

const emergencyRoute = `
// ==========================================
// EMERGENCY DB HEAL ROUTE (UNPROTECTED)
// ==========================================
app.get('/api/heal-db', async (req, res) => {
    try {
        const { sequelize, XlStockist, XlProduct } = require('./db');
        let logs = [];
        
        try {
            await sequelize.query("ALTER TABLE xl_stockists ADD COLUMN uid VARCHAR(255);");
            logs.push("Added uid to xl_stockists");
        } catch(e) { logs.push("xl_stockists error: " + e.message); }
        
        try {
            await sequelize.query("ALTER TABLE xl_products ADD COLUMN uid VARCHAR(255);");
            logs.push("Added uid to xl_products");
        } catch(e) { logs.push("xl_products error: " + e.message); }
        
        try {
            const scount = await XlStockist.count();
            const pcount = await XlProduct.count();
            logs.push(\`Total Stockists in DB: \${scount}\`);
            logs.push(\`Total Products in DB: \${pcount}\`);
        } catch(e) { logs.push("Count error: " + e.message); }

        res.json({ success: true, logs });
    } catch(e) {
        res.json({ success: false, error: e.message });
    }
});
`;

if (!server.includes('/api/heal-db')) {
    server = server.replace("app.use('/api/admin', adminRouter);", emergencyRoute + "\napp.use('/api/admin', adminRouter);");
    fs.writeFileSync(serverFile, server);
    console.log("Added /api/heal-db to server.js");
}

// 2. Add PW visibility toggle to xla-frontend
const loginFile = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/Login.tsx';
let login = fs.readFileSync(loginFile, 'utf8');

if (!login.includes('showPassword')) {
    login = login.replace("import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';", "import { Mail, Lock, LogIn, ArrowRight, Eye, EyeOff } from 'lucide-react';");
    login = login.replace("const [password, setPassword] = useState('');", "const [password, setPassword] = useState('');\n  const [showPassword, setShowPassword] = useState(false);");
    
    // Replace password input block
    const pwdBlock = `<input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                  required
                />`;
    
    const newPwdBlock = `<input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>`;
                
    login = login.replace(pwdBlock, newPwdBlock);
    fs.writeFileSync(loginFile, login);
    console.log("Added PW visibility to xla-frontend Login.tsx");
}

