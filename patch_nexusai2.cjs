const fs = require('fs');
const file = 'src/components/NexusAI.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /<div className="w-full md:w-1\/2 flex flex-col items-center justify-start md:justify-center min-h-\[300px\] flex-1 md:h-\[500px\] mb-4 md:mb-0">/g,
  '<div className="w-full md:w-1/2 flex flex-col items-center justify-start md:justify-center h-[350px] md:h-[500px] mb-4 md:mb-0 shrink-0">'
);

fs.writeFileSync(file, code);
console.log("NexusAI.tsx patched 2.");
