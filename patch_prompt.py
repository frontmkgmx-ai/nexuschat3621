import re

with open('meu-agente/src/agent.py', 'r') as f:
    content = f.read()

content = content.replace(
    'Você fala em português (Brasil).',
    'Você fala EXCLUSIVAMENTE em português do Brasil (pt-BR) de forma natural e clara.'
)

with open('meu-agente/src/agent.py', 'w') as f:
    f.write(content)
