const fs = require('fs');
const file = 'src/components/NexusAI.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /onDisconnected=\{\(\) => \{\s*setToken\(null\);\s*\}\}/g,
  'onDisconnected={() => {\n              setToken(null);\n              onClose();\n            }}'
);

fs.writeFileSync(file, code);
console.log("Patched onDisconnected.");
