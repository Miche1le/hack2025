#!/bin/bash

# Скрипт для настройки локальной LLM через Ollama
# Использование: ./setup-local-llm.sh [model-name]

set -e

MODEL_NAME=${1:-"mistral:7b-instruct"}
OLLAMA_HOST=${OLLAMA_HOST:-"http://localhost:11434"}

echo "🚀 Setting up local LLM with Ollama..."
echo "Model: $MODEL_NAME"
echo "Host: $OLLAMA_HOST"

# Проверяем, запущен ли Ollama
echo "📡 Checking Ollama status..."
if ! curl -s "$OLLAMA_HOST/api/tags" > /dev/null; then
    echo "❌ Ollama is not running. Please start Ollama first:"
    echo "   docker-compose up -d ollama"
    echo "   or"
    echo "   ollama serve"
    exit 1
fi

echo "✅ Ollama is running"

# Проверяем, загружена ли модель
echo "🔍 Checking if model $MODEL_NAME is available..."
if curl -s "$OLLAMA_HOST/api/tags" | grep -q "$MODEL_NAME"; then
    echo "✅ Model $MODEL_NAME is already available"
else
    echo "📥 Pulling model $MODEL_NAME..."
    ollama pull "$MODEL_NAME"
    echo "✅ Model $MODEL_NAME downloaded successfully"
fi

# Тестируем модель
echo "🧪 Testing model..."
TEST_RESPONSE=$(curl -s -X POST "$OLLAMA_HOST/api/generate" \
    -H "Content-Type: application/json" \
    -d '{
        "model": "'"$MODEL_NAME"'",
        "prompt": "Summarize this text in 2-3 sentences: The quick brown fox jumps over the lazy dog.",
        "stream": false
    }')

if echo "$TEST_RESPONSE" | grep -q "response"; then
    echo "✅ Model test successful"
    echo "📝 Test response:"
    echo "$TEST_RESPONSE" | jq -r '.response' 2>/dev/null || echo "Response received (jq not available)"
else
    echo "❌ Model test failed"
    echo "Response: $TEST_RESPONSE"
    exit 1
fi

echo ""
echo "🎉 Local LLM setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables:"
echo "   export LOCAL_SUMMARY_URL=\"$OLLAMA_HOST/api/generate\""
echo "   export OLLAMA_MODEL=\"$MODEL_NAME\""
echo "   export USE_LOCAL_ONLY=\"true\""
echo ""
echo "2. Or add to your .env file:"
echo "   LOCAL_SUMMARY_URL=$OLLAMA_HOST/api/generate"
echo "   OLLAMA_MODEL=$MODEL_NAME"
echo "   USE_LOCAL_ONLY=true"
echo ""
echo "3. Restart your application to use local LLM"
