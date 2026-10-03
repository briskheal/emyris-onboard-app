const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            let modified = false;

            const regexes = [
                /\{([a-zA-Z0-9_]+)\.date\}/g,
                /\{([a-zA-Z0-9_]+)\.createdAt\}/g,
                /\{([a-zA-Z0-9_]+)\.updatedAt\}/g
            ];

            regexes.forEach(regex => {
                content = content.replace(regex, (match, p1) => {
                    modified = true;
                    let field = 'date';
                    if (match.includes('createdAt')) field = 'createdAt';
                    if (match.includes('updatedAt')) field = 'updatedAt';
                    return "{formatDDMMYYYY(" + p1 + "." + field + ")}";
                });
            });
            
            if (modified && !content.includes('function formatDDMMYYYY')) {
                let importEndIdx = content.lastIndexOf('import ');
                if (importEndIdx === -1) importEndIdx = 0;
                const insertIdx = content.indexOf('\n', importEndIdx) + 1;
                
                const utilityFn = "\nfunction formatDDMMYYYY(dateStr: string) {\n" +
"  if (!dateStr) return '-';\n" +
"  if (/^\\d{1,2}-\\d{1,2}-\\d{4}$/.test(dateStr)) return dateStr;\n" +
"  if (/^\\d{4}-\\d{1,2}-\\d{1,2}$/.test(dateStr)) {\n" +
"      const parts = dateStr.split('T')[0].split('-');\n" +
"      return parts[2].padStart(2, '0') + '-' + parts[1].padStart(2, '0') + '-' + parts[0];\n" +
"  }\n" +
"  try {\n" +
"      const d = new Date(dateStr);\n" +
"      if (!isNaN(d.getTime())) {\n" +
"          return String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear();\n" +
"      }\n" +
"  } catch (e) {}\n" +
"  return dateStr;\n" +
"}\n";
                content = content.substring(0, insertIdx) + utilityFn + content.substring(insertIdx);
                fs.writeFileSync(fullPath, content);
                console.log('Modified:', fullPath);
            }
        }
    }
}

processDir(path.join(__dirname, 'xla-frontend', 'src'));
