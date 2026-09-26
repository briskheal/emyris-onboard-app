const fs = require('fs');
const path1 = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/TourProgram.tsx';
const path2 = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/pages/CallReport.tsx';

let content1 = fs.readFileSync(path1, 'utf8');
content1 = content1.replace("import { ChevronLeft, UserPlus, ChevronDown, RefreshCw } from 'lucide-react';", "import { ChevronLeft, RefreshCw } from 'lucide-react';");
fs.writeFileSync(path1, content1);

let content2 = fs.readFileSync(path2, 'utf8');
content2 = content2.replace("import { ChevronLeft, UserPlus, ChevronDown, RefreshCw } from 'lucide-react';", "import { ChevronLeft, RefreshCw } from 'lucide-react';");
fs.writeFileSync(path2, content2);