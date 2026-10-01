const fs = require('fs');
let content = fs.readFileSync('xla-frontend/src/pages/Dashboard.tsx', 'utf8');

// Replace hardcoded monthInput state
const oldState = "const [monthInput, setMonthInput] = useState('2026-09');";
const newState = `const [monthInput, setMonthInput] = useState(() => {
    const d = new Date();
    return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}\`;
  });`;

if (content.includes(oldState)) {
    content = content.replace(oldState, newState);
    fs.writeFileSync('xla-frontend/src/pages/Dashboard.tsx', content);
    console.log("Successfully patched monthInput to default to current month.");
} else {
    console.log("Could not find the hardcoded monthInput state.");
}
