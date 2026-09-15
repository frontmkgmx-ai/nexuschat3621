with open('meu-agente/src/agent.py', 'r') as f:
    content = f.read()

import re

new_tts = """tts=inference.TTS(
            model="cartesia",
            language="pt",
            voice="a5136bf9-224c-4d76-b823-52bd5efcffcc",
            extra_kwargs={
                "speed": 0.95,
                "volume": 1.0
            }
        ),"""

content = re.sub(r'tts=inference\.TTS\([^)]+\),', new_tts, content)

with open('meu-agente/src/agent.py', 'w') as f:
    f.write(content)
