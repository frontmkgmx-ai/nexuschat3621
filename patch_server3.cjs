const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('RoomServiceClient')) {
    code = code.replace(
        /import \{ AccessToken, AgentDispatchClient \} from "livekit-server-sdk";/g,
        'import { AccessToken, AgentDispatchClient, RoomServiceClient } from "livekit-server-sdk";'
    );
}

if (!code.includes('pendingDispatches')) {
    code = code.replace(
        /app\.get\("\/api\/livekit\/token", async \(req, res\) => \{/g,
        'const pendingDispatches = new Set<string>();\n\n  app.get("/api/livekit/token", async (req, res) => {'
    );

    const agentLogic = `
      if (!pendingDispatches.has(roomName)) {
        pendingDispatches.add(roomName);
        try {
          const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);
          let hasAgent = false;
          try {
             const participants = await roomService.listParticipants(roomName);
             hasAgent = participants.some(p => p.name === "meu-agente" || p.identity.includes("agent"));
          } catch(e) {
             // Room might not exist yet, so no agent
          }
          if (!hasAgent) {
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
        /try \{\n\s*const agentClient = new AgentDispatchClient\(wsUrl, apiKey, apiSecret\);\n\s*await agentClient\.createDispatch\(roomName, "meu-agente"\);\n\s*\} catch \(err\) \{\n\s*console\.error\("LiveKit agent dispatch error:", err\);\n\s*\}/g,
        agentLogic
    );
}

fs.writeFileSync(file, code);
console.log("server.ts patched with dispatch lock");
