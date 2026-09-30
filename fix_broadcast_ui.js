const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

if (!c.includes('const [validFrom, setValidFrom] = useState(')) {
    c = c.replace(/const \[broadcastMessage, setBroadcastMessage\] = useState\(''\);/,
    `const [broadcastMessage, setBroadcastMessage] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');`);
}

c = c.replace(/const handleBroadcast = async \(\) => \{[\s\S]*?axios\.post\('\/api\/xl\/admin\/announcement', \{ message: broadcastMessage \}\)[\s\S]*?alert\('Broadcast sent successfully!'\);[\s\S]*?setIsBroadcastModalOpen\(false\);[\s\S]*?\} catch\(e: any\) \{/m,
`const handleBroadcast = async () => {
    if (!broadcastMessage) return alert('Message is required');
    try {
      const payload: any = { message: broadcastMessage };
      if (validFrom) payload.validFrom = validFrom;
      if (validUntil) payload.validUntil = validUntil;
      const res = await axios.post('/api/xl/admin/announcement', payload);
      if (res.data.success) {
        alert('Broadcast sent successfully!');
        setBroadcastMessage('');
        setValidFrom('');
        setValidUntil('');
        setIsBroadcastModalOpen(false);
      }
    } catch(e: any) {`);

c = c.replace(/<textarea[\s\S]*?className="w-full bg-slate-50 dark:bg-\[\#1a1a2e\] border border-slate-200 dark:border-\[\#3b3b5a\] rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 min-h-\[120px\] resize-none mb-4"[\s\S]*?><\/textarea>/,
`<textarea 
              value={broadcastMessage}
              onChange={e => setBroadcastMessage(e.target.value)}
              placeholder="Enter your scrolling announcement here..."
              className="w-full bg-slate-50 dark:bg-[#1a1a2e] border border-slate-200 dark:border-[#3b3b5a] rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 min-h-[120px] resize-none mb-4"
            ></textarea>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Start Time (Optional)</label>
                <input type="datetime-local" style={{ colorScheme: isLightMode ? 'light' : 'dark' }} value={validFrom} onChange={e => setValidFrom(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1a1a2e] border border-slate-200 dark:border-[#3b3b5a] rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">End Time (Optional)</label>
                <input type="datetime-local" style={{ colorScheme: isLightMode ? 'light' : 'dark' }} value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full bg-slate-50 dark:bg-[#1a1a2e] border border-slate-200 dark:border-[#3b3b5a] rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500" />
              </div>
            </div>`);

fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', c);
console.log('Fixed UI in Dashboard');
