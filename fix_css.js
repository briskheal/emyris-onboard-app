const fs = require('fs');
let css = fs.readFileSync('xla-frontend/src/index.css', 'utf8');

if (!css.includes('@custom-variant dark')) {
    css = css.replace('@import "tailwindcss";', '@import "tailwindcss";\n@custom-variant dark (&:where(.dark, .dark *));');
    fs.writeFileSync('xla-frontend/src/index.css', css);
    console.log('Added dark variant to CSS');
} else {
    console.log('Already there');
}
