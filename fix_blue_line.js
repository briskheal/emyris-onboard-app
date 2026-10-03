const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/TourProgram.tsx', 'utf8');

const replacement = `                <tr className="bg-[#171f3a] border-b-2 border-sky-500">
                  <td colSpan={10} className="py-0"></td>
                </tr>
              </tbody>`;

c = c.replace('              </tbody>', replacement);
fs.writeFileSync('xla-frontend/src/pages/TourProgram.tsx', c);
