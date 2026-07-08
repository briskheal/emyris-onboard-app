const fs = require('fs');
let scriptJs = fs.readFileSync('script.js', 'utf8');

scriptJs = scriptJs.replace(/alert\('Your exam has been submitted successfully\.'\);/, "alert('Your exam has been submitted successfully! Your final result will be declared after the Admin reviews your Descriptive Assessment.');");

fs.writeFileSync('script.js', scriptJs);
console.log('Fixed final alert');
