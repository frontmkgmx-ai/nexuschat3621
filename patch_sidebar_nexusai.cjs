const fs = require('fs');
const file = 'src/components/Sidebar.tsx';
let code = fs.readFileSync(file, 'utf8');

// Modify the interface
code = code.replace(
  /onOpenProfile\?: \(userId: string\) => void;\n\}\) \{/g,
  'onOpenProfile?: (userId: string) => void;\n  onOpenNexusAI?: () => void;\n}) {'
);
code = code.replace(
  /onOpenProfile,\n\}: \{/g,
  'onOpenProfile,\n  onOpenNexusAI,\n}: {'
);

// Modify the click handler
code = code.replace(
  /onClick=\{\(\) => setActiveTab\("NEXUS_AI"\)\}/g,
  'onClick={() => { if (onOpenNexusAI) onOpenNexusAI(); }}'
);

// Remove the NexusAI component import and usage
code = code.replace(
  /import NexusAI from "\.\/NexusAI";/g,
  ''
);

code = code.replace(
  /\{activeTab === "NEXUS_AI" && \([\s\S]*?<NexusAI currentUser=\{currentUser\} onClose=\{\(\) => setActiveTab\("CHATS"\)\} \/>[\s\S]*?<\/motion\.div>\n\s*\}\)\n/g,
  ''
);

fs.writeFileSync(file, code);
console.log("Sidebar patched");
