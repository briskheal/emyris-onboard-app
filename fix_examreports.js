const fs = require('fs');

let js = fs.readFileSync('admin-script.js', 'utf8');

const target = `    } else if (tab === 'testbank') {
        document.getElementById('adminTestbankTab').classList.remove('hidden');
        fetchTestBankQuestions();
    } else {`;
    
const replace = `    } else if (tab === 'testbank') {
        document.getElementById('adminTestbankTab').classList.remove('hidden');
        fetchTestBankQuestions();
    } else if (tab === 'examreports') {
        document.getElementById('adminExamreportsTab').classList.remove('hidden');
        fetchExamReports();
    } else {`;

if (js.includes(target)) {
    js = js.replace(target, replace);
    fs.writeFileSync('admin-script.js', js);
    console.log("Fixed switchAdminTab in admin-script.js");
} else {
    console.log("Failed to find target in admin-script.js");
}
