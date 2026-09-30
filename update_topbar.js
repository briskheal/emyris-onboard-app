const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

// Add Sun to lucide-react imports
c = c.replace('Search, Download, Activity, Calendar } from \'lucide-react\'', 'Search, Download, Activity, Calendar, Sun } from \'lucide-react\'');

// Update the Top Bar Buttons to include Change Theme and shift them slightly left
const oldButtons = `<div className="flex items-center gap-3 md:gap-6">
          <button className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold hover:shadow-lg hover:shadow-orange-500/20 transition-all">
            <span>Upgrade to Advance Plan</span>
          </button>
          <button className="hidden lg:flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-full text-xs font-bold hover:bg-emerald-500/20 transition-all">
            <span>Refer & Earn</span>
          </button>
          
          <button className="text-[#8b8baf] hover:text-sky-400 transition-colors relative hidden sm:block">
            <MessageSquare size={20} />
          </button>`;

const newButtons = `<div className="flex items-center gap-4 md:gap-6 mr-auto pl-4">
          <button className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold hover:shadow-lg hover:shadow-orange-500/20 transition-all">
            <span>Upgrade to Advance Plan</span>
          </button>
          <button className="hidden lg:flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-full text-xs font-bold hover:bg-emerald-500/20 transition-all">
            <span>Refer & Earn</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-[#8b8baf] hover:text-amber-400 transition-colors relative hidden sm:flex items-center gap-1 group" title="Change Theme">
            <Sun size={20} />
            <span className="text-[10px] absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 px-2 py-1 rounded">Change Theme</span>
          </button>

          <div className="w-px h-5 bg-[#3b3b5a] hidden sm:block mx-1"></div>

          <button onClick={() => alert('Broadcast Message modal opening... (WIP)')} className="text-[#8b8baf] hover:text-sky-400 transition-colors relative hidden sm:block" title="Broadcast Scroll Message">
            <MessageSquare size={20} />
          </button>`;

c = c.replace(oldButtons, newButtons);

// Make the Bell button trigger an alert placeholder for now
c = c.replace('<button className="text-[#8b8baf] hover:text-emerald-400 transition-colors relative">', '<button onClick={() => alert(\\\'Admin Notifications dropdown opening... (WIP)\\\')} className="text-[#8b8baf] hover:text-emerald-400 transition-colors relative" title="View Recent Submissions">');

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Top bar UI updated.');
