const fs = require('fs');
const file = 'src/components/NexusAI.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /audio=\{true\}\s+video=\{true\}/g,
  'audio={true}\n            video={false}'
);

fs.writeFileSync(file, code);
console.log("Video set to false.");
