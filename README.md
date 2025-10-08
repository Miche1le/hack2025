# 🚀 News Intelligence - AI-Powered News Aggregator

Современный агрегатор новостей с локальной LLM суммаризацией в стиле Apple Intelligence.

![News Intelligence](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=for-the-badge&logo=typescript)
![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-green?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)

## ✨ Особенности

- 🤖 **Локальная LLM** суммаризация через Ollama (Mistral, Llama 2, Phi)
- 🎨 **Apple Intelligence дизайн** с горизонтальной прокруткой
- 🌙 **Темная/светлая тема** с плавными переходами
- ⚡ **Быстрая фильтрация** и сортировка в реальном времени
- 🔄 **Автообновление** RSS фидов
- 📱 **Адаптивный дизайн** для всех устройств
- 🐳 **Docker поддержка** для легкого развертывания

## 🚀 Быстрый старт

### 1. Установка Ollama (Windows)

```bash
# Скачайте установщик с https://ollama.ai/download
# Или через PowerShell:
Set-ExecutionPolicy Bypass -Scope Process -Force
Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://ollama.ai/install.ps1'))
```

### 2. Запуск Ollama

```bash
# Запустите Ollama сервер
ollama serve

# В новом терминале загрузите модель
ollama pull mistral:7b-instruct
```

### 3. Настройка проекта

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd hack2025

# Установите зависимости
pnpm install

# Создайте .env.local
echo "LOCAL_SUMMARY_URL=http://localhost:11434/api/generate" > .env.local
echo "OLLAMA_MODEL=mistral:7b-instruct" >> .env.local
echo "USE_LOCAL_ONLY=true" >> .env.local

# Запустите приложение
pnpm dev
```

Откройте http://localhost:3000 🎉

## 🐳 Docker развертывание

```bash
# Запуск всех сервисов
docker-compose up -d

# Загрузка модели
docker exec news-summarizer-ollama ollama pull mistral:7b-instruct

# Проверка статуса
docker-compose ps
```

## 🎨 Дизайн Apple Intelligence

- **Горизонтальная прокрутка** карточек новостей
- **Увеличенные карточки** (384px) с градиентами
- **Плавные анимации** и hover-эффекты
- **Современная навигация** с backdrop-blur
- **Минималистичный интерфейс** в стиле Apple

## 🤖 Локальная LLM

### Поддерживаемые модели

| Модель | Размер | Скорость | Качество |
|--------|--------|----------|----------|
| `mistral:7b-instruct` | 7B | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| `llama2:7b-chat` | 7B | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| `phi:2.7b` | 2.7B | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| `codellama:7b-instruct` | 7B | ⭐⭐ | ⭐⭐⭐⭐⭐ |

### Fallback стратегия

1. **Локальная LLM** (если настроена)
2. **OpenAI API** (если доступен ключ)
3. **Экстрактивная суммаризация** (всегда работает)

## ⚙️ Настройки

В интерфейсе доступна панель настроек для:

- 🔄 **Переключение режимов**: Local LLM ↔ OpenAI API
- 🎛️ **Выбор модели**: Mistral, Llama 2, Code Llama, Phi
- 📏 **Длина резюме**: 200-600 символов
- 🎯 **Качество**: Низкое (быстро) ↔ Высокое (лучшее качество)

## 📊 Производительность

- **Локальная LLM**: 2-5 сек на статью
- **OpenAI API**: 1-2 сек на статью
- **Экстрактивная**: мгновенно
- **Память**: 4-8 GB для Mistral 7B

## 🛠️ Разработка

```bash
# Установка зависимостей
pnpm install

# Запуск в режиме разработки
pnpm dev

# Сборка
pnpm build

# Запуск продакшн
pnpm start

# Тесты
pnpm test
```

## 📁 Структура проекта

```
hack2025/
├── apps/web/                 # Next.js приложение
│   ├── app/
│   │   ├── api/             # API роуты
│   │   ├── components/      # React компоненты
│   │   └── page.tsx         # Главная страница
├── packages/shared/         # Общие утилиты
│   ├── summarize.ts         # Логика суммаризации
│   ├── feed-utils.ts        # Обработка RSS
│   └── types.ts            # TypeScript типы
├── scripts/                # Скрипты автоматизации
├── docker-compose.yml      # Docker конфигурация
└── README.md              # Документация
```

## 🚀 Деплой

### VPS с Docker

```bash
git clone <repository-url>
cd hack2025
docker-compose up -d
```

### Vercel (только фронтенд)

```bash
vercel --prod
# Ollama на отдельном сервере
```

## 📚 Документация

- [QUICK_START.md](QUICK_START.md) - Быстрый старт
- [LOCAL_LLM_SETUP.md](LOCAL_LLM_SETUP.md) - Настройка локальной LLM
- [OLLAMA_WINDOWS_SETUP.md](OLLAMA_WINDOWS_SETUP.md) - Установка Ollama на Windows
- [ARCHITECTURE.md](ARCHITECTURE.md) - Архитектура системы

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Commit изменения
4. Push в branch
5. Создайте Pull Request

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE)

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте, что Ollama запущен: `curl http://localhost:11434/api/tags`
2. Убедитесь в правильности переменных окружения
3. Проверьте логи: `docker-compose logs`
4. Перезапустите сервисы: `docker-compose restart`

---

**News Intelligence** - современный способ оставаться в курсе событий с помощью ИИ! 🚀