const fs = require('fs');
const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add showNexusAI state
if (!code.includes('showNexusAI')) {
  code = code.replace(
    /const \[showOnboarding, setShowOnboarding\] = useState\(false\);/,
    'const [showOnboarding, setShowOnboarding] = useState(false);\n  const [showNexusAI, setShowNexusAI] = useState(false);'
  );
}

// Add NexusAI import
if (!code.includes('import NexusAI')) {
  code = code.replace(
    /import Sidebar from "\.\/components\/Sidebar";/,
    'import Sidebar from "./components/Sidebar";\nimport NexusAI from "./components/NexusAI";'
  );
}

// Update Sidebar props
code = code.replace(
  /onOpenProfile=\{setPublicProfileUser\}\n\s*\/>/g,
  'onOpenProfile={setPublicProfileUser}\n          onOpenNexusAI={() => setShowNexusAI(true)}\n        />'
);

code = code.replace(
  /isMobileHidden=\{!!selectedConvo\}/g,
  'isMobileHidden={!!selectedConvo || showNexusAI}'
);

// Conditional render for ChatWindow / NexusAI
const chatWindowBlock = `<ChatWindow 
          currentUser={currentUser} 
          conversation={selectedConvo} 
          isMobileHidden={!selectedConvo}
          onBack={() => setSelectedConvo(null)}
          onOpenProfile={setPublicProfileUser}
        />`;

// Replace the actual ChatWindow usage with a conditional
code = code.replace(
  /<ChatWindow\s+currentUser=\{currentUser\}\s+conversation=\{selectedConvo\}\s+isMobileHidden=\{\!selectedConvo\}\s+onBack=\{\(\) => setSelectedConvo\(null\)\}\s+onOpenProfile=\{setPublicProfileUser\}\s+\/>/g,
  `{showNexusAI ? (
          <div className="\${!showNexusAI ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full relative overflow-hidden w-full min-w-0 bg-zinc-950">
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
console.log("App.tsx patched");
