const fs = require('fs');

['DoctorsListReport', 'ChemistsListReport', 'StockistsListReport'].forEach(name => {
    let file = `xla-frontend/src/pages/${name}.tsx`;
    let content = fs.readFileSync(file, 'utf8');

    // Reduce table row and header vertical paddings to match ManageDCS
    content = content.replace(/py-4/g, 'py-2.5');
    content = content.replace(/px-6/g, 'px-4');

    fs.writeFileSync(file, content);
});

console.log("Compacted table row heights.");
