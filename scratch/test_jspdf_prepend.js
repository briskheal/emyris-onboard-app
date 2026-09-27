const { jsPDF } = require("jspdf");

const doc = new jsPDF();
doc.text("Hello World", 10, 10);

console.log("Page 1 length:", doc.internal.pages[1].length);

// Save the content
const originalContent = [...doc.internal.pages[1]];

// Clear and prepend
doc.internal.pages[1] = [];
doc.text("Prepend Test", 10, 20);
doc.internal.pages[1] = doc.internal.pages[1].concat(originalContent);

console.log("Page 1 length after prepend:", doc.internal.pages[1].length);
