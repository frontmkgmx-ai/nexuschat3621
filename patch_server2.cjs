const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const roomName = \(req\.query\.room as string\) \|\| "nexus-ai-room";\n\s*const participantName = \(req\.query\.name as string\) \|\| "user-" \+ Math\.floor\(Math\.random\(\) \* 10000\);/g,
  `let roomName = (req.query.room as string) || "nexus-ai-room";
      let participantName = (req.query.name as string) || "user-" + Math.floor(Math.random() * 10000);
      
      // Basic validation
      if (!roomName.startsWith("nexus-ai-") || roomName.length > 50) {
          return res.status(400).json({ error: "Invalid room name" });
      }
      if (participantName.length > 50) {
          participantName = participantName.substring(0, 50);
      }`
);

fs.writeFileSync(file, code);
console.log("server.ts patched 2");
