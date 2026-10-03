const fs = require('fs');

function patchFile(filepath, isCallReport) {
    let c = fs.readFileSync(filepath, 'utf8');

    // Fix the mapping mapping date and day correctly
    const badDateStr = "date: new Date(dStr).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\\//g, '-'),";
    const badDayStr = "day: new Date(dStr).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\\//g, '-'),";

    c = c.replace(badDateStr, "date: dStr,");
    c = c.replace(badDayStr, "day: new Date(dStr).toLocaleDateString('en-US', { weekday: 'long' }),");

    // Replace Sr heading with Date in CallReport
    if (isCallReport) {
        c = c.replace(
            '<th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Sr</th>',
            '<th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Date</th>'
        );
        // There are two tables in CallReport (summary vs detailed). Let's replace globally if possible
        c = c.replace(
            /<th className="px-4 py-3 text-\[11px\] font-bold text-white border-r border-\[#2d2f45\] whitespace-nowrap">Sr<\/th>/g,
            '<th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Date</th>'
        );
    } else {
        // If it's TourProgram, let's also check if there is a Sr column
        c = c.replace(
            /<th className="px-4 py-3 text-\[11px\] font-bold text-white border-r border-\[#2d2f45\] whitespace-nowrap">Sr<\/th>/g,
            '<th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Date</th>'
        );
        c = c.replace(
            /<th className="px-4 py-3 text-\[11px\] font-bold text-white border-r border-\[#2d2f45\] whitespace-nowrap">Date &uarr;<\/th>/g,
            '<th className="px-4 py-3 text-[11px] font-bold text-white border-r border-[#2d2f45] whitespace-nowrap">Date &uarr;</th>'
        );
    }

    fs.writeFileSync(filepath, c);
    console.log(`Patched ${filepath}`);
}

patchFile('xla-frontend/src/pages/CallReport.tsx', true);
patchFile('xla-frontend/src/pages/TourProgram.tsx', false);
