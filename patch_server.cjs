const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('AgentDispatchClient')) {
    code = code.replace(
        /import \{ AccessToken \} from "livekit-server-sdk";/g,
        'import { AccessToken, AgentDispatchClient } from "livekit-server-sdk";'
    );
    code = code.replace(
        /const token = await at\.toJwt\(\);/g,
        'const token = await at.toJwt();\n      try {\n        const agentClient = new AgentDispatchClient(wsUrl, apiKey, apiSecret);\n        await agentClient.createDispatch(roomName, "meu-agente");\n      } catch (err) {\n        console.error("LiveKit agent dispatch error:", err);\n      }'
    );
    fs.writeFileSync(file, code);
    console.log("server.ts patched");
}
