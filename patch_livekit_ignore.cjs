const fs = require('fs');
const file = 'src/components/NexusAI.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /onError=\{\(err\) => \{ console\.error\("LiveKit Error:", err\); toast\.error\("Falha na conexão com o servidor AI\."\); setToken\(null\); setErrorState\(true\); \}\}/g,
  'onError={(err: any) => { console.error("LiveKit Error:", err); if (err?.message?.includes("Client initiated disconnect") || err?.message?.includes("ParticipantDisconnected")) return; toast.error("Falha na conexão com o servidor AI."); setToken(null); setErrorState(true); }}'
);

fs.writeFileSync(file, code);
console.log("Patched to ignore expected disconnects.");
