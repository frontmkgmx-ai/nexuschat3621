import sys
import os

with open('meu-agente/src/agent.py', 'r') as f:
    content = f.read()

content = content.replace(
    'inference.TTS(\n            model="fishaudio/s2.1-pro", voice="fa4c9eb3dccc4806b382b40d61c6b10a"\n        )',
    'inference.TTS(\n            model="cartesia/sonic-3.5", voice="79a125e8-cd45-4c13-8a67-188112f4dd22"\n        )' # Using an arbitrary voice, or we should use openai
)

with open('meu-agente/src/agent.py', 'w') as f:
    f.write(content)
