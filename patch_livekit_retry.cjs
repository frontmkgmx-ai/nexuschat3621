const fs = require('fs');
const file = 'src/components/NexusAI.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const \[token, setToken\] = useState<string \| null>\(null\);/g,
  'const [token, setToken] = useState<string | null>(null);\n  const [errorState, setErrorState] = useState<boolean>(false);'
);

code = code.replace(
  /const connectToAI = async \(\) => \{/g,
  'const connectToAI = async () => {\n    setErrorState(false);'
);

code = code.replace(
  /toast\.error\(err\.message \|\| 'Erro ao conectar ao Agente AI'\);/g,
  'toast.error(err.message || \'Erro ao conectar ao Agente AI\');\n      setErrorState(true);'
);

code = code.replace(
  /\{!token \|\| !url \? \(/g,
  '{errorState ? (\n          <div className="flex flex-col items-center text-zinc-400 gap-4">\n            <p className="font-medium text-sm text-red-400">Falha na conexão com o servidor.</p>\n            <button onClick={connectToAI} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium text-sm transition-colors">Tentar Novamente</button>\n          </div>\n        ) : !token || !url ? ('
);

code = code.replace(
  /onError=\{\(err\) => \{ console\.error\("LiveKit Error:", err\); toast\.error\("Falha na conexão com o servidor AI\."\); setToken\(null\); \}\}/g,
  'onError={(err) => { console.error("LiveKit Error:", err); toast.error("Falha na conexão com o servidor AI."); setToken(null); setErrorState(true); }}'
);

fs.writeFileSync(file, code);
console.log("Added retry state.");
