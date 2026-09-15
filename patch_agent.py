import re

with open('meu-agente/src/agent.py', 'r') as f:
    content = f.read()

# Replace the TTS block
new_tts = """tts=inference.TTS(
            model="elevenlabs/eleven_multilingual_v2",
            language="pt",
            voice="7iWpEw5Nt05GC1B0",
        ),"""

content = re.sub(r'tts=inference\.TTS\([\s\S]*?\),', new_tts, content)

with open('meu-agente/src/agent.py', 'w') as f:
    f.write(content)
