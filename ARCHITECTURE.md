# 🏗️ Архитектура News Intelligence с локальной LLM

```
┌─────────────────────────────────────────────────────────────────┐
│                    News Intelligence Frontend                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Apple-style   │  │  Horizontal     │  │   Settings      │  │
│  │   Header        │  │  Feed Scroll    │  │   Panel         │  │
│  │                 │  │                 │  │                 │  │
│  │ • News Intel    │  │ • Card Carousel │  │ • Local LLM     │  │
│  │ • RSS Input     │  │ • Smooth Scroll │  │ • OpenAI Toggle │  │
│  │ • Dark Theme    │  │ • Navigation    │  │ • Model Select  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   RSS Parser    │  │  Summarizer     │  │   Cache Layer   │  │
│  │                 │  │                 │  │                 │  │
│  │ • Feed Fetch    │  │ • Local LLM     │  │ • LRU Cache     │  │
│  │ • HTML Clean    │  │ • OpenAI API    │  │ • TTL Support   │  │
│  │ • Deduplication │  │ • Fallback      │  │ • Stats Track   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Summarization Backend                        │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   Local LLM     │    │   OpenAI API    │    │  Extractive │  │
│  │   (Ollama)      │    │   (Fallback)    │    │  Fallback   │  │
│  │                 │    │                 │    │             │  │
│  │ • Mistral 7B    │    │ • GPT-4 Mini    │    │ • Keyword   │  │
│  │ • Llama 2       │    │ • Fast & Reliable│   │ • Sentence  │  │
│  │ • Phi 2         │    │ • Cloud-based  │    │ • Scoring   │  │
│  │ • Offline       │    │ • Requires Key │    │ • Always On │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Infrastructure                        │
│                                                                 │
│  ┌─────────────────┐              ┌─────────────────┐           │
│  │   Ollama        │              │   Next.js App   │           │
│  │   Container     │              │   Container     │           │
│  │                 │              │                 │           │
│  │ • Port 11434    │◄─────────────┤ • Port 3000     │           │
│  │ • Model Storage │              │ • API Routes   │           │
│  │ • GPU Support   │              │ • Static Files  │           │
│  │ • Auto-restart  │              │ • Build Cache   │           │
│  └─────────────────┘              └─────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Поток данных

1. **RSS Fetch**: Получение новостей из RSS фидов
2. **HTML Clean**: Очистка HTML тегов и нормализация
3. **Deduplication**: Удаление дубликатов по заголовку/ссылке
4. **Summarization**: 
   - Попытка локальной LLM (если настроена)
   - Fallback на OpenAI API (если доступен ключ)
   - Финальный fallback на экстрактивную суммаризацию
5. **Caching**: Сохранение результатов с TTL
6. **UI Rendering**: Отображение в горизонтальной ленте

## 🎯 Ключевые особенности

- **Offline-first**: Работает без интернета с локальной LLM
- **Graceful degradation**: Автоматический fallback при сбоях
- **Performance**: Кеширование и параллельная обработка
- **Scalability**: Docker контейнеры для легкого масштабирования
- **User Experience**: Apple Intelligence дизайн с плавными анимациями

## 🚀 Развертывание

### Локальная разработка
```bash
docker-compose up -d
pnpm dev
```

### Продакшн (VPS)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Vercel (только фронтенд)
```bash
vercel --prod
# Ollama на отдельном сервере
```
