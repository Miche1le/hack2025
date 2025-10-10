#!/bin/bash

echo "🔍 Проверка всех изменений"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. TypeScript
echo "1️⃣  Проверка TypeScript..."
if npm run type-check > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ TypeScript: 0 ошибок${NC}"
else
    echo -e "   ${YELLOW}⚠️  TypeScript: есть ошибки${NC}"
fi
echo ""

# 2. ESLint
echo "2️⃣  Проверка ESLint..."
npm run lint 2>&1 | grep -E "✖|problems" | head -1
echo ""

# 3. Тест поиска
echo "3️⃣  Тест поиска по русским словам..."
if node test-search.js > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Поиск работает корректно${NC}"
else
    echo -e "   ${YELLOW}⚠️  Есть проблемы с поиском${NC}"
fi
echo ""

# 4. Тест Redis
echo "4️⃣  Проверка Redis..."
node test-redis.js 2>&1 | grep -E "✅|❌" | head -1
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Для проверки в браузере:"
echo "   1. Запустите: npm run dev"
echo "   2. Откройте: http://localhost:3000"
echo "   3. Попробуйте поиск по русским словам"
echo ""
echo "🚀 Для развертывания на Vercel:"
echo "   См. QUICKSTART_VERCEL.md"
echo ""
echo "📚 Подробности: CHECK_RESULTS.md"

