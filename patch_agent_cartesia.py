with open('meu-agente/src/agent.py', 'r') as f:
    content = f.read()

content = content.replace(
    'tts=openai.TTS(voice="nova")',
    'tts=inference.TTS(model="cartesia/sonic", language="pt", voice="6a16c1f4-462b-44de-998d-ccdaa4125a0a")'
)

with open('meu-agente/src/agent.py', 'w') as f:
    f.write(content)
