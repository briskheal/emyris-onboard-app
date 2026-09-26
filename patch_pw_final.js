const fs = require('fs');

const file = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/Login.tsx';
let content = fs.readFileSync(file, 'utf8');

const startMarker = `type="password"`;
let startIndex = content.indexOf(startMarker);

if (startIndex !== -1) {
    const pwdInput = content.substring(startIndex - 20, startIndex + 400); // Grab the input block
    const replacement = `<input 
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
    
    // Find the end of the input tag
    let endIndex = content.indexOf('/>', startIndex) + 2;
    content = content.substring(0, startIndex - 24) + replacement + content.substring(endIndex);
    fs.writeFileSync(file, content);
    console.log("Successfully replaced password block!");
} else {
    console.log("Could not find password input");
}
