@echo off
chcp 65001 >nul
echo 🚀 News Intelligence - Оптимизация для Ryzen 9 365 + 32GB RAM
echo.

REM Проверяем системные характеристики
echo 💪 Обнаружена мощная система:
echo    - Ryzen 9 365 с AI ускорением (73 TOPS)
echo    - 32GB RAM - отлично для больших моделей
echo    - AI процессор для оптимизации LLM
echo.

REM Проверяем директорию
if not exist "apps\web\package.json" (
    echo ❌ Запустите скрипт из корневой директории проекта
    echo Текущая директория: %CD%
    pause
    exit /b 1
)

echo 📋 Настройка оптимизированной конфигурации...
echo.

REM Создаем оптимизированный .env.local
if not exist ".env.local" (
    echo # Оптимизация для Ryzen 9 365 + 32GB RAM > .env.local
    echo LOCAL_SUMMARY_URL=http://localhost:11434/api/generate >> .env.local
    echo OLLAMA_MODEL=mistral:7b-instruct >> .env.local
    echo USE_LOCAL_ONLY=true >> .env.local
    echo. >> .env.local
    echo # Производительность >> .env.local
    echo OLLAMA_NUM_PARALLEL=4 >> .env.local
    echo OLLAMA_MAX_LOADED_MODELS=2 >> .env.local
    echo OLLAMA_FLASH_ATTENTION=1 >> .env.local
    echo. >> .env.local
    echo # Кеширование >> .env.local
    echo SUMMARY_CACHE_TTL_MS=3600000 >> .env.local
    echo MAX_CACHE_ENTRIES=1000 >> .env.local
    echo ✅ Создан оптимизированный .env.local
) else (
    echo ✅ .env.local уже существует
)

echo.
echo 📦 Установка зависимостей...
call pnpm install
if %errorlevel% neq 0 (
    echo ❌ Ошибка установки зависимостей
    pause
    exit /b 1
)
echo ✅ Зависимости установлены

echo.
echo 🎨 Запуск News Intelligence с Apple + OpenAI дизайном...
echo.
echo 🌐 Приложение будет доступно по адресу: http://localhost:3000
echo.
echo 🎯 Что вы увидите:
echo    - Apple Intelligence дизайн с горизонтальной прокруткой
echo    - OpenAI ChatGPT стиль интерфейса
echo    - Темная/светлая тема
echo    - Плавные анимации и переходы
echo.
echo 🤖 Для локальной LLM (рекомендуется для вашей системы):
echo    1. Скачайте Ollama: https://ollama.ai/download
echo    2. Запустите: ollama serve --num-parallel 4
echo    3. Загрузите модель: ollama pull mistral:7b-instruct
echo    4. Или для лучшего качества: ollama pull llama2:13b-chat
echo.
echo 📊 Ожидаемая производительность:
echo    - Mistral 7B: 1-2 секунды на статью
echo    - Llama 2 13B: 2-3 секунды на статью
echo    - Использование RAM: ~6-8GB из 32GB
echo    - AI ускорение: автоматически
echo.
echo 🚀 Запуск приложения...
echo.

REM Запуск приложения
cd apps\web
call pnpm dev
