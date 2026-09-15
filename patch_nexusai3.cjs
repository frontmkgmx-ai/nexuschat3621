const fs = require('fs');
const file = 'src/components/NexusAI.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /<div className="flex justify-between items-center p-4 border-b border-zinc-800\/80 bg-zinc-900\/90 backdrop-blur-md sticky top-0 z-10 shrink-0">/g,
  '<div className="flex justify-between items-center p-3 md:p-4 border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md sticky top-0 z-10 shrink-0">'
);

fs.writeFileSync(file, code);
console.log("NexusAI.tsx patched 3.");
