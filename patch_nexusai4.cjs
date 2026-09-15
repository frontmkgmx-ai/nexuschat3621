const fs = require('fs');
const file = 'src/components/NexusAI.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /<div className="flex flex-col h-full absolute inset-0 w-full bg-zinc-950 z-\[100\] md:z-10">/g,
  '<div className="flex flex-col h-full relative w-full bg-zinc-950 z-[100] md:z-10 min-w-0 min-h-0">'
);

fs.writeFileSync(file, code);
console.log("NexusAI.tsx patched 4");
