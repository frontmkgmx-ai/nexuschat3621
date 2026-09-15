const fs = require('fs');
const file = 'src/components/NexusAI.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('onError={')) {
  code = code.replace(
    /onDisconnected=\{\(\) => \{/g,
    'onError={(err) => { console.error("LiveKit Error:", err); toast.error("Falha na conexão com o servidor AI."); setToken(null); }}\n            onDisconnected={() => {'
  );
  fs.writeFileSync(file, code);
  console.log("Patched onError.");
} else {
  console.log("Already patched.");
}
