const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

const agentLogic = `
      if (!pendingDispatches.has(roomName)) {
        pendingDispatches.add(roomName);
        try {
          const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);
          let hasMyAgent = false;
          try {
             const participants = await roomService.listParticipants(roomName);
             for (const p of participants) {
                 if (p.name === "meu-agente") {
                     hasMyAgent = true;
                 } else if (p.kind === 4) {
                     // 4 is AGENT. Kick any other agent that auto-joined
                     console.log("Kicking auto-joined agent:", p.identity);
                     await roomService.removeParticipant(roomName, p.identity);
                 }
             }
          } catch(e) {
             // Room might not exist yet
          }
          if (!hasMyAgent) {
             const agentClient = new AgentDispatchClient(wsUrl, apiKey, apiSecret);
             await agentClient.createDispatch(roomName, "meu-agente");
          }
        } catch (err) {
          console.error("LiveKit agent dispatch error:", err);
        } finally {
          setTimeout(() => pendingDispatches.delete(roomName), 5000);
        }
      }
`;

code = code.replace(
    /if \(\!pendingDispatches\.has\(roomName\)\) \{[\s\S]*?setTimeout\(\(\) => pendingDispatches\.delete\(roomName\), 5000\);\n\s*\}\n\s*\}/,
    agentLogic.trim()
);

fs.writeFileSync(file, code);
console.log("server.ts patched to kick other agents correctly");
