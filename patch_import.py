with open('meu-agente/src/agent.py', 'r') as f:
    content = f.read()

import re
content = re.sub(r'from livekit\.plugins import ai_coustics, anam, openai', r'from livekit.plugins import ai_coustics, openai', content)

with open('meu-agente/src/agent.py', 'w') as f:
    f.write(content)
