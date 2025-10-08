# News Intelligence - Local LLM Integration

Этот проект теперь поддерживает локальную суммаризацию новостей через Ollama, что позволяет работать полностью офлайн без зависимости от внешних API.

## 🚀 Быстрый старт с Docker

### 1. Запуск с локальной LLM

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd hack2025

# Запустите все сервисы через Docker Compose
docker-compose up -d

# Дождитесь загрузки Ollama (может занять несколько минут)
docker-compose logs -f ollama

# Загрузите модель Mistral
docker exec news-summarizer-ollama ollama pull mistral:7b-instruct
```

### 2. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
# Локальная LLM настройки
LOCAL_SUMMARY_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=mistral:7b-instruct
USE_LOCAL_ONLY=true

# Опционально: OpenAI API как fallback
OPENAI_API_KEY=your-openai-key-here
```

### 3. Запуск приложения

```bash
# Установите зависимости
pnpm install

# Запустите в режиме разработки
pnpm dev
```

## 🛠 Ручная настройка Ollama

### Установка Ollama

```bash
# Linux/macOS
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Скачайте установщик с https://ollama.ai/download
```

### Запуск и настройка

```bash
# Запустите Ollama
ollama serve

# В новом терминале загрузите модель
ollama pull mistral:7b-instruct

# Или используйте скрипт автоматической настройки
chmod +x scripts/setup-local-llm.sh
./scripts/setup-local-llm.sh mistral:7b-instruct
```

## 🎨 Дизайн в стиле Apple Intelligence

Интерфейс был полностью переработан в стиле Apple Intelligence с:

- **Горизонтальная прокрутка**: Карточки новостей прокручиваются горизонтально, как в карусели
- **Современные карточки**: Увеличенный размер (384px), скругленные углы, градиенты и тени
- **Плавные анимации**: Hover-эффекты, трансформации и переходы
- **Улучшенная навигация**: Стрелки с backdrop-blur эффектом
- **Темная тема**: Полная поддержка темной темы в стиле Apple

## ⚙️ Настройки суммаризатора

В интерфейсе доступна панель настроек для:

- **Переключение режимов**: OpenAI API ↔ Локальная LLM
- **Настройка модели**: Выбор между Mistral, Llama 2, Code Llama, Phi
- **Длина резюме**: От 200 до 600 символов
- **Качество**: Низкое (быстро) ↔ Высокое (лучшее качество)

## 🔧 Доступные модели

| Модель | Размер | Скорость | Качество | Рекомендация |
|--------|--------|----------|----------|--------------|
| `mistral:7b-instruct` | 7B | ⭐⭐⭐ | ⭐⭐⭐⭐ | **Рекомендуется** |
| `llama2:7b-chat` | 7B | ⭐⭐⭐ | ⭐⭐⭐⭐ | Хорошая альтернатива |
| `phi:2.7b` | 2.7B | ⭐⭐⭐⭐ | ⭐⭐⭐ | Быстрая, компактная |
| `codellama:7b-instruct` | 7B | ⭐⭐ | ⭐⭐⭐⭐⭐ | Лучшее качество |

## 📊 Производительность

### Локальная LLM
- **Время обработки**: 2-5 секунд на статью
- **Память**: 4-8 GB RAM (зависит от модели)
- **CPU**: Рекомендуется 4+ ядер
- **GPU**: Опционально, ускоряет обработку в 2-3 раза

### Fallback стратегия
1. **Локальная LLM** (если настроена)
2. **OpenAI API** (если доступен ключ)
3. **Экстрактивная суммаризация** (всегда работает)

## 🐳 Docker конфигурация

```yaml
# docker-compose.yml
services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    # Для GPU поддержки (раскомментировать):
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - LOCAL_SUMMARY_URL=http://ollama:11434/api/generate
      - OLLAMA_MODEL=mistral:7b-instruct
```

## 🔍 Отладка

### Проверка статуса Ollama

```bash
# Проверить статус
curl http://localhost:11434/api/tags

# Тест модели
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral:7b-instruct",
    "prompt": "Summarize: The quick brown fox jumps over the lazy dog.",
    "stream": false
  }'
```

### Логи Docker

```bash
# Логи Ollama
docker-compose logs ollama

# Логи приложения
docker-compose logs web

# Перезапуск сервисов
docker-compose restart
```

## 🚀 Деплой

### VPS с Docker

```bash
# На сервере
git clone <repository-url>
cd hack2025

# Настройте переменные окружения
cp .env.example .env.local
nano .env.local

# Запустите
docker-compose up -d

# Проверьте статус
docker-compose ps
```

### Vercel (только фронтенд)

```bash
# Установите переменные в Vercel Dashboard:
# LOCAL_SUMMARY_URL=https://your-ollama-server.com/api/generate
# OLLAMA_MODEL=mistral:7b-instruct
# USE_LOCAL_ONLY=true

vercel --prod
```

## 📝 Примечания

- **Первая загрузка модели** может занять 5-15 минут
- **GPU ускоряет** обработку в 2-3 раза
- **Кеширование** работает для всех режимов суммаризации
- **Fallback** обеспечивает работу даже при сбоях LLM

## 🤝 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose logs`
2. Убедитесь, что Ollama запущен: `curl http://localhost:11434/api/tags`
3. Проверьте переменные окружения
4. Перезапустите сервисы: `docker-compose restart`
