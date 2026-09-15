const fs = require('fs');
let code = fs.readFileSync('src/components/StatusViewer.test.tsx', 'utf8');
code = code.replace('vi.advanceTimersByTime(11000);', `console.log("advancing timers"); vi.advanceTimersByTime(11000);`);
fs.writeFileSync('src/components/StatusViewer.test.tsx', code);
