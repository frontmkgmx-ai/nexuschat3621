with open('meu-agente/src/agent.py', 'r') as f:
    content = f.read()

import re

new_tts = """tts=inference.TTS(
            model="cartesia/sonic-3.5",
            language="pt",
            voice="95856005-0332-41b0-935f-352e296aa0df",
            extra_kwargs={
                "speed": 0.85,
                "volume": 1.0
            }
        ),"""

content = re.sub(r'tts=inference\.TTS\([^)]+\),', new_tts, content)

with open('meu-agente/src/agent.py', 'w') as f:
    f.write(content)
