with open('meu-agente/src/agent.py', 'r') as f:
    content = f.read()

content = content.replace(
    'from livekit.plugins import ai_coustics, anam',
    'from livekit.plugins import ai_coustics, anam, openai'
)

content = content.replace(
    'tts=inference.TTS(\n            model="cartesia/sonic-3.5", voice="79a125e8-cd45-4c13-8a67-188112f4dd22"\n        )',
    'tts=openai.TTS(voice="nova")'
)

content = content.replace(
    'expressive=True,',
    '# expressive=True,'
)

with open('meu-agente/src/agent.py', 'w') as f:
    f.write(content)
