const fs = require('fs');

let file = fs.readFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js', 'utf8');

// 1. We need to inject the XlExpense fetch inside the payrun generation.
// Search for: const allOngoingLoans = await AssignedLoan.find({ status: 'Ongoing', deductionType: 'Monthly' });
// We will inject the expense fetch before this, or just do it per user.

const regexPayrun = /let loanDed = 0;\s*let advDed = 0;/;

const replacementPayrun = `
                let loanDed = 0;
                let advDed = 0;
                let approvedExpense = 0;
                try {
                    const { XlExpense } = require('../db');
                    const { Op } = require('sequelize');
                    const monthStrNum = String(monthNum).padStart(2, '0');
                    // Find all expenses for this employee in this month
                    const exps = await XlExpense.findAll({
                        where: {
                            [Op.or]: [
                                { employeeId: applicant.empCode },
                                { employeeId: applicant.email },
                                { employeeId: applicant.uid }
                            ],
                            date: { [Op.like]: \`\${year}-\${monthStrNum}%\` },
                            status: 'Approved'
                        },
                        raw: true
                    });
                    
                    for (const ex of exps) {
                        approvedExpense += (parseFloat(ex.dailyAllowance) || 0);
                        approvedExpense += (parseFloat(ex.travelAllowance) || 0);
                        approvedExpense += (parseFloat(ex.miscAllowance) || 0);
                    }
                } catch(err) {
                    console.error('Error fetching expenses for payrun:', err);
                }
`;

file = file.replace(regexPayrun, replacementPayrun);

const regexExpenseField = /expense:\ 0,/;
const replacementExpenseField = `expense: Math.round(approvedExpense),`;

file = file.replace(regexExpenseField, replacementExpenseField);

// Also add expense to final salary! 
const regexFinalSal = /finalSalary:\ Math\.round\(baseNetSalary - ptDed - pfDed - loanDed - advDed\),/;
const replacementFinalSal = `finalSalary: Math.round(baseNetSalary - ptDed - pfDed - loanDed - advDed + approvedExpense),`;

file = file.replace(regexFinalSal, replacementFinalSal);

fs.writeFileSync('D:/MY WORK FLOW/Emyris Onboard App/routes/admin.js', file);
console.log("Patched admin.js to link expenses to Payrun!");
