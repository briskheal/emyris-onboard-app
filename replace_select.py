import re

file_path = "D:\\MY WORK FLOW\\Emyris Onboard App\\xl-frontend\\src\\pages\\TourProgram.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacement = '''function SearchableSelect({ value, onChange, options, placeholder, hideSearch }: { value: string, onChange: (val: string) => void, options: any[], placeholder?: string, hideSearch?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="relative">
            {hideSearch ? (
                <button 
                   type="button"
                   onClick={() => setIsOpen(!isOpen)}
                   className="w-full text-left bg-[#27273f] text-sky-300 font-bold p-3.5 rounded-lg border border-[#3b3b5a] focus:border-sky-500 shadow-sm flex justify-between items-center"
                >
                   <span className="truncate">{value || placeholder}</span>
                   <span className="text-slate-400 text-xs">▼</span>
                </button>
            ) : (
                <div className="relative flex items-center">
                    <input 
                       type="text"
                       onClick={() => setIsOpen(true)}
                       value={isOpen ? search : (value || '')}
                       onChange={e => {
                           setSearch(e.target.value);
                           if (!isOpen) setIsOpen(true);
                       }}
                       placeholder={placeholder || 'Search...'}
                       className="w-full bg-[#27273f] text-sky-300 font-bold p-3.5 rounded-lg border border-[#3b3b5a] focus:border-sky-500 shadow-sm outline-none placeholder:font-normal placeholder:text-slate-500"
                    />
                    <span className="absolute right-4 text-slate-400 text-xs pointer-events-none">▼</span>
                </div>
            )}
            
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[90]" onClick={() => { setIsOpen(false); setSearch(''); }}></div>
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#27273f] border border-[#3b3b5a] rounded-lg shadow-2xl z-[100] overflow-hidden">
                        <div className="max-h-[350px] overflow-y-auto">
                            {filtered.map((o, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => handleSelect(o.value)}
                                    className="p-3 hover:bg-[#3b3b5a] text-white font-bold border-b border-[#3b3b5a] last:border-0 cursor-pointer text-sm"
                                >
                                    {o.label}
                                </div>
                            ))}
                            {filtered.length === 0 && <div className="p-4 text-center text-slate-400 text-sm font-medium">No results found</div>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}'''

pattern = re.compile(r"function SearchableSelect\(.*?\).*?return\s*\(.*?</div>\s*\);\s*\}", re.DOTALL)
new_content = pattern.sub(replacement, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Updated SearchableSelect successfully!")
