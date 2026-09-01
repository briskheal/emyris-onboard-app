const fs = require('fs');
try {
    let code = fs.readFileSync('frontend/applicant-react/src/components/Dashboard.jsx', 'utf8');
    
    // The previous ternary check was:
    // applicant.status === 'joined' ? 'Role:' : 'Applied Role:'
    // and
    // applicant.status === 'joined' ? (applicant.appliedRole || applicant.role || 'Confirmed Employee') : ...
    
    const targetStatusCheck = "applicant.status === 'joined'";
    const newStatusCheck = "['Joined (Probation)', 'Confirmed Employee', 'Confirmation Extended', 'joined'].includes(applicant.status)";
    
    code = code.replace(new RegExp(targetStatusCheck, 'g'), newStatusCheck);
    
    fs.writeFileSync('frontend/applicant-react/src/components/Dashboard.jsx', code);
    console.log('Successfully updated Dashboard.jsx');
} catch (error) {
    console.error('Error modifying Dashboard.jsx:', error);
}
