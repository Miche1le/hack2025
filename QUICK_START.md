# 🚀 News Intelligence - Запуск с локальной LLM

## Быстрый старт

### 1. Запуск через Docker (рекомендуется)

```bash
# Клонируйте и перейдите в директорию
cd hack2025

# Запустите все сервисы
docker-compose up -d

# Дождитесь загрузки Ollama (2-3 минуты)
docker-compose logs -f ollama

# Загрузите модель Mistral
docker exec news-summarizer-ollama ollama pull mistral:7b-instruct

# Проверьте статус
curl http://localhost:11434/api/tags
```

### 2. Настройка переменных окружения

Создайте `.env.local`:

```env
LOCAL_SUMMARY_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=mistral:7b-instruct
USE_LOCAL_ONLY=true
```

### 3. Запуск приложения

```bash
# Установите зависимости
pnpm install

# Запустите в режиме разработки
pnpm dev
```

## 🎨 Новый дизайн Apple Intelligence

- ✅ **Горизонтальная прокрутка** карточек новостей
- ✅ **Увеличенные карточки** (384px) с градиентами
- ✅ **Плавные анимации** и hover-эффекты
- ✅ **Современная навигация** с backdrop-blur
- ✅ **Полная поддержка** темной темы

## 🤖 Локальная LLM

- ✅ **Ollama интеграция** через Docker
- ✅ **Mistral 7B** модель по умолчанию
- ✅ **Fallback стратегия**: Local LLM → OpenAI → Экстрактивная
- ✅ **Настройки в UI** для переключения режимов
- ✅ **Кеширование** результатов суммаризации

## 📱 Использование

1. **Добавьте RSS фиды** в текстовое поле
2. **Настройте фильтры** по ключевым словам
3. **Выберите режим суммаризации** в настройках
4. **Прокручивайте горизонтально** для просмотра новостей
5. **Используйте стрелки** или клавиши ← →

## 🔧 Доступные команды

```bash
# Разработка
pnpm dev

# Сборка
pnpm build

# Запуск продакшн
pnpm start

# Тесты
pnpm test

# Docker
docker-compose up -d
docker-compose down
docker-compose restart
```

## 📊 Производительность

- **Локальная LLM**: 2-5 сек на статью
- **OpenAI API**: 1-2 сек на статью  
- **Экстрактивная**: мгновенно
- **Память**: 4-8 GB для Mistral 7B

## 🆘 Решение проблем

### Ollama не запускается
```bash
docker-compose logs ollama
docker-compose restart ollama
```

### Модель не загружается
```bash
docker exec news-summarizer-ollama ollama pull mistral:7b-instruct
```

### Приложение не подключается к LLM
```bash
curl http://localhost:11434/api/tags
# Проверьте переменные окружения
```

## 🎯 Следующие шаги

1. **Запустите** `docker-compose up -d`
2. **Откройте** http://localhost:3000
3. **Добавьте** RSS фиды
4. **Настройте** локальную LLM в настройках
5. **Наслаждайтесь** новым дизайном! 🎉
