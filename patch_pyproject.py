with open('meu-agente/pyproject.toml', 'r') as f:
    content = f.read()

content = content.replace(
    '"livekit-plugins-ai-coustics~=0.2",',
    '"livekit-plugins-ai-coustics~=0.2",\n    "livekit-plugins-openai",'
)

with open('meu-agente/pyproject.toml', 'w') as f:
    f.write(content)
