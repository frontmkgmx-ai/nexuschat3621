const fs = require('fs');
let code = fs.readFileSync('src/components/StatusViewer.test.tsx', 'utf8');

const regexNaN = /const video = screen\.getByRole\("presentation", \{ hidden: true \}\) \|\| document\.querySelector\("video"\);/m;
code = code.replace(regexNaN, `const video = document.querySelector("video");`);
    
fs.writeFileSync('src/components/StatusViewer.test.tsx', code);
