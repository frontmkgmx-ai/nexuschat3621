const fs = require('fs');
const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /<ChatWindow\s*currentUser=\{currentUser\}\s*conversation=\{selectedConvo\}\s*isMobileHidden=\{\!selectedConvo\}\s*onBack=\{\(\) => setSelectedConvo\(null\)\}\s*onOpenProfile=\{setPublicProfileUser\}\s*onOpenNexusAI=\{\(\) => setShowNexusAI\(true\)\}\s*\/>/g,
  `{showNexusAI ? (
          <div className="flex flex-1 flex-col h-full relative overflow-hidden w-full min-w-0 bg-zinc-950 md:border-l md:border-zinc-800">
            <NexusAI currentUser={currentUser} onClose={() => setShowNexusAI(false)} />
          </div>
        ) : (
          <ChatWindow 
            currentUser={currentUser} 
            conversation={selectedConvo} 
            isMobileHidden={!selectedConvo}
            onBack={() => setSelectedConvo(null)}
            onOpenProfile={setPublicProfileUser}
          />
        )}`
);

fs.writeFileSync(file, code);
console.log("App.tsx patched 2");
