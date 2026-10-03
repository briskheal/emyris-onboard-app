const fs = require('fs');

['DoctorsListReport', 'ChemistsListReport', 'StockistsListReport'].forEach(name => {
    let file = `xla-frontend/src/pages/${name}.tsx`;
    let content = fs.readFileSync(file, 'utf8');

    // Fix the extra div in the header
    content = content.replace(
        /<\/svg>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g,
        `</svg>\n               </div>\n            </div>\n          </div>\n        </div>`
    );

    // Ensure the bottom matches perfectly
    // 3 divs at the end: 
    // </div>
    // </div>
    // </div>
    // );
    // }
    content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/g, '</div>\n      </div>\n    );\n  }');
    
    // In Chemists/Stockists we might have left a trailing `</div>` from `bg-[#151521]` removal.
    // The previous patch `patch_free_flow` removed the outer `div className="flex-1 bg-[#151521] overflow-hidden flex flex-col"`
    // but DID NOT remove its closing tag!
    // The structure was:
    // <div bg-[#151521]>
    //   <div overflow-x-auto>
    //     <table>
    //   </div>
    // </div>
    // We replaced the first two lines with `<div className="overflow-x-auto w-full pb-10">`
    // Which removed ONE opening div.
    // That means we have one extra closing div at the end.
    
    content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/g, '</div>\n    </div>\n  );\n}');


    fs.writeFileSync(file, content);
});

console.log("Fixed extra closing tags.");
