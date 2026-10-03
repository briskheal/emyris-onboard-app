const fs = require('fs');
const file = 'xla-frontend/src/pages/ManageProducts.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Add Search icon
c = c.replace(
  "import { ArrowLeft, Trash2, Edit, Eye, Upload } from 'lucide-react';",
  "import { ArrowLeft, Trash2, Edit, Eye, Upload, Search } from 'lucide-react';"
);

// 2. Add searchTerm state
const stateMatch = "const [isEditing, setIsEditing] = useState(false);";
c = c.replace(
  stateMatch,
  stateMatch + "\n    const [searchTerm, setSearchTerm] = useState('');"
);

// 3. Update paginated and add filteredData
const paginatedMatch = "const paginated = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);";

// We need to replace only the one inside ProductTab. 
// ProductTab has "CREATE PRODUCT" below it.
const ptIdx = c.indexOf("function ProductTab()");
const pagIdx = c.indexOf(paginatedMatch, ptIdx);

const replacement = `const filteredData = data.filter(p => 
      (p.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.uid || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.division || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const paginated = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);`;

c = c.substring(0, pagIdx) + replacement + c.substring(pagIdx + paginatedMatch.length);

// 4. Add search bar UI
const formEndMatch = "</form>";
const formEndIdx = c.indexOf(formEndMatch, ptIdx);

const searchBarUI = `</form>
        
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm} 
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-sky-500 shadow-inner"
            />
          </div>
        </div>`;

c = c.substring(0, formEndIdx) + searchBarUI + c.substring(formEndIdx + formEndMatch.length);

// 5. Update TableFooter in ProductTab
const footerMatch = '<TableFooter data={data} fileName="Products"';
c = c.replace(footerMatch, '<TableFooter data={filteredData} fileName="Products"');

fs.writeFileSync(file, c);
console.log('Successfully patched ManageProducts.tsx!');
