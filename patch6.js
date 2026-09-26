const fs = require('fs');
const path1 = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/TourProgram.tsx';
let content1 = fs.readFileSync(path1, 'utf8');
content1 = content1.replace("import { ChevronLeft, RefreshCw, ChevronDown } from 'lucide-react';", "import { ChevronLeft, RefreshCw } from 'lucide-react';");
fs.writeFileSync(path1, content1);