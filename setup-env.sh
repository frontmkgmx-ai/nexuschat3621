#!/bin/bash

echo "Configurando variÃ¡veis de ambiente para o Nexus Chat..."

# VariÃ¡veis que serÃ£o configuradas ou atualizadas
declare -A ENV_VARS
ENV_VARS=(
  ["PUBLIC_API_URL"]="https://call.ironvalecraft.shop"
  ["PUBLIC_PANEL_URL"]="https://painelcall.ironvalecraft.shop"
  ["SOCKET_PATH"]="/socket.io"
  ["API_PORT"]="4000"
  ["PANEL_PORT"]="4001"
  ["NODE_ENV"]="production"
  ["VITE_CALL_API_URL"]="https://call.ironvalecraft.shop"
  ["VITE_CALL_WS_URL"]="https://call.ironvalecraft.shop"
  ["VITE_CALL_SOCKET_PATH"]="/socket.io"
  ["VITE_CALL_PANEL_URL"]="https://painelcall.ironvalecraft.shop"
)

ENV_FILE=".env"
ENV_EXAMPLE=".env.example"

# Se o .env (backend) e .env (frontend) forem separados, vocÃª deve configurar ambos. Aqui estamos atualizando no .env da raÃ­z
if [ -f "$ENV_FILE" ]; then
    echo "Criando backup de $ENV_FILE..."
    cp "$ENV_FILE" "${ENV_FILE}.backup-$(date +%s)"
else
    echo "Arquivo $ENV_FILE nÃ£o encontrado. Criando um novo baseado em $ENV_EXAMPLE se existir..."
    if [ -f "$ENV_EXAMPLE" ]; then
       cp "$ENV_EXAMPLE" "$ENV_FILE"
    else
       touch "$ENV_FILE"
    fi
fi

# Iterar sobre as variÃ¡veis e aplicar as modificaÃ§Ãµes no arquivo .env
for KEY in "${!ENV_VARS[@]}"; do
    VALUE="${ENV_VARS[$KEY]}"
    
    # Se a chave jÃ¡ existe altera, caso contrÃ¡rio adiciona
    if grep -q "^${KEY}=" "$ENV_FILE"; then
        sed -i "s|^${KEY}=.*|${KEY}=${VALUE}|" "$ENV_FILE"
    else
        echo "${KEY}=${VALUE}" >> "$ENV_FILE"
    fi
done

echo "As seguintes variÃ¡veis de ambiente foram configuradas em $ENV_FILE:"
for KEY in "${!ENV_VARS[@]}"; do
    echo "- ${KEY}=${ENV_VARS[$KEY]}"
done

echo ""
echo "Arquivos alterados: $ENV_FILE"
echo ""
echo "Comandos recomendados:"
echo "- Para a API/Backend (se rodar nesse repo): pm2 restart all ou npm run start"
echo "- Para o Frontend/Painel: npm run build para incluir as novas variÃ¡veis VITE_"
