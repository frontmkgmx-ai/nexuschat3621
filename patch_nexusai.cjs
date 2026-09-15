const fs = require('fs');
const file = 'src/components/NexusAI.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /<div className="flex-1 relative flex flex-col items-center justify-center p-4">/g,
  '<div className="flex-1 relative flex flex-col items-center justify-center p-2 md:p-4 min-h-0 overflow-hidden">'
);

code = code.replace(
  /className="w-full h-full flex flex-col items-center justify-center"/g,
  'className="w-full h-full flex flex-col min-h-0"'
);

code = code.replace(
  /<div className="flex flex-col md:flex-row items-center justify-center w-full max-w-5xl gap-6 md:gap-10 h-full p-2">/g,
  '<div className="flex flex-col md:flex-row items-center justify-start md:justify-center w-full max-w-5xl gap-4 md:gap-10 h-full p-2 overflow-y-auto custom-scrollbar">'
);

code = code.replace(
  /<div className="relative w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 /g,
  '<div className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 shrink-0 '
);

code = code.replace(
  /<div className="w-full md:w-1\/2 flex flex-col items-center justify-center h-\[350px\] md:h-\[500px\]">/g,
  '<div className="w-full md:w-1/2 flex flex-col items-center justify-start md:justify-center min-h-[300px] flex-1 md:h-[500px] mb-4 md:mb-0">'
);

// fix sticky header height issues (make it shrink-0 just in case)
code = code.replace(
  /<div className="flex justify-between items-center p-4 border-b border-zinc-800\/80 bg-zinc-900\/90 backdrop-blur-md sticky top-0 z-10">/g,
  '<div className="flex justify-between items-center p-4 border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md sticky top-0 z-10 shrink-0">'
);


fs.writeFileSync(file, code);
console.log("NexusAI.tsx patched.");
