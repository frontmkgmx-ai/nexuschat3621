const fs = require('fs');
let code = fs.readFileSync('src/components/StatusViewer.test.tsx', 'utf8');
code = code.replace(/vi\.advanceTimersByTime\(5100\);/g, 'vi.advanceTimersByTime(11000);');
fs.writeFileSync('src/components/StatusViewer.test.tsx', code);
