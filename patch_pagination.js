const fs = require('fs');

function addPagination(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Add states for pagination
    if (!content.includes('const [currentPage')) {
        content = content.replace(
            /const \[viewingDoctor, setViewingDoctor\] = useState<any>\(null\);|const \[viewingChemist, setViewingChemist\] = useState<any>\(null\);|const \[viewingStockist, setViewingStockist\] = useState<any>\(null\);/,
            `$&
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedState, selectedHq]);`
        );
    }

    // Add paginatedList logic
    if (!content.includes('const paginatedList =')) {
        content = content.replace(
            /const exportToExcel = \(\) => {/g,
            `const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToExcel = () => {`
        );
    }

    // Remove the old export button block above the table (if any) or below
    // Usually it was `<div className="flex justify-end p-4 border-t border-[#3b3b5a] bg-[#1c1c2e]"> ... </div>`
    const oldExportRegex = /<div className="flex justify-end p-4 border-t border-\[#3b3b5a\] bg-\[#1c1c2e\]">[\s\S]*?<\/div>/;
    content = content.replace(oldExportRegex, '');

    // Replace filteredList.map with paginatedList.map in tbody
    content = content.replace(/filteredList\.map\(\(d, i\)/g, 'paginatedList.map((d, i)');
    content = content.replace(/\{i \+ 1\}/g, '{(currentPage - 1) * itemsPerPage + i + 1}');
    content = content.replace(/filteredList\.map\(\(c, i\)/g, 'paginatedList.map((c, i)');
    content = content.replace(/filteredList\.map\(\(s, i\)/g, 'paginatedList.map((s, i)');

    // Change table container styling to remove boundary box but keep side vertical scroll bar
    content = content.replace(
        /<div className="flex-1 bg-\[#151521\] rounded-2xl border border-\[#3b3b5a\] shadow-2xl overflow-hidden flex flex-col">/g,
        `<div className="flex-1 bg-[#151521] overflow-hidden flex flex-col">`
    );
    content = content.replace(
        /<div className="overflow-x-auto flex-1">/g,
        `<div className="overflow-x-auto overflow-y-auto flex-1">`
    );

    // Insert new bottom pagination component after the table wrapper `</div>`
    // This is a bit tricky, let's find `</table>\s*</div>`
    const tableEndRegex = /<\/table>\s*<\/div>/;
    const paginationHtml = `</table>
            </div>

            <div className="flex-shrink-0 flex flex-wrap items-center justify-between py-4 z-20">
              <div className="flex items-center gap-4 mb-2 sm:mb-0">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 bg-[#1e1e2d] border border-[#3b3b5a] rounded text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                    &lt; Prev
                </button>
                <span className="text-sm text-slate-400 font-medium">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 bg-[#1e1e2d] border border-[#3b3b5a] rounded text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                    Next &gt;
                </button>
              </div>
              
              <div className="flex items-center gap-6">
                <button onClick={exportToExcel} className="flex items-center gap-2 bg-[#2d2d44] hover:bg-[#3b3b5a] text-slate-300 hover:text-white px-4 py-2 rounded transition-colors text-sm font-medium">
                    <Download size={16} /> Export
                </button>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">Show</span>
                    <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-[#1e1e2d] border border-[#3b3b5a] rounded px-2 py-1 text-slate-300 focus:outline-none">
                        {[10, 20, 50, 100, 200, 500, 1000].map(n => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>
              </div>
            </div>`;

    if (!content.includes('itemsPerPage} onChange={e => { setItemsPerPage')) {
        content = content.replace(tableEndRegex, paginationHtml);
    }
    
    // Change "SHOWING (X) ENTRIES" header
    content = content.replace(
        /SHOWING \(\{filteredList\.length\}\) ENTRIES/g,
        `SHOWING ({filteredList.length}) ENTRIES`
    );

    fs.writeFileSync(file, content);
}

['DoctorsListReport', 'ChemistsListReport', 'StockistsListReport'].forEach(name => {
    addPagination(`xla-frontend/src/pages/${name}.tsx`);
});

console.log("Pagination added to all list reports.");
