const fs = require('fs');
let p = 'D:/MY WORK FLOW/Emyris Onboard App/xla-frontend/src/components/SettingsPreferences.tsx';
let content = fs.readFileSync(p, 'utf8');

const oldClick = `const wd = settings.workingDays || { Sunday: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true };
                                  setSettings({ ...settings, workingDays: { ...wd, [day]: !wd[day] } });`;

const newClick = `const wd = settings.workingDays || { Sunday: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true };
                                  const updatedWd = { ...wd, [day]: !wd[day] };
                                  setSettings({ ...settings, workingDays: updatedWd });
                                  handleToggle('workingDays', updatedWd as any);`;

content = content.replace(oldClick, newClick);

fs.writeFileSync(p, content, 'utf8');
console.log("Patched SettingsPreferences.tsx");
