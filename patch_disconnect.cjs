const fs = require('fs');
const file = 'src/components/NexusAI.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /function CustomControlBar\(\) \{/g,
  'function CustomControlBar({ onClose }: { onClose: () => void }) {'
);

code = code.replace(
  /<CustomControlBar \/>/g,
  '<CustomControlBar onClose={onClose} />'
);

code = code.replace(
  /<DisconnectButton className="p-3 bg-red-500\/10 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors font-medium flex items-center gap-2">\s*Desconectar\s*<\/DisconnectButton>/g,
  `<button onClick={onClose} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors font-medium flex items-center gap-2">
         Desconectar
      </button>`
);

code = code.replace(
  /function AgentInterface\(\) \{/g,
  'function AgentInterface({ onClose }: { onClose: () => void }) {'
);

code = code.replace(
  /<AgentInterface \/>/g,
  '<AgentInterface onClose={onClose} />'
);


fs.writeFileSync(file, code);
console.log("Patched disconnect button.");
