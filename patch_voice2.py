with open('meu-agente/src/agent.py', 'r') as f:
    content = f.read()

import re

new_tts = """tts=inference.TTS(
            model="cartesia/sonic-3.5",
            language="pt",
            voice="6a16c1f4-462b-44de-998d-ccdaa4125a0a",
            extra_kwargs={
                "speed": 0.95,
                "volume": 1.0
            }
        ),"""

content = re.sub(r'tts=inference\.TTS\([^)]+\),', new_tts, content)

with open('meu-agente/src/agent.py', 'w') as f:
    f.write(content)
