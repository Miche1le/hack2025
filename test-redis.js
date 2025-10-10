/**
 * Тестируем Redis подключение
 */

async function testRedis() {
  console.log("🔌 Тестирование Redis подключения\n");
  
  // Проверяем переменные окружения
  console.log("1. Проверка переменных окружения:");
  const redisUrl = process.env.REDIS_URL;
  const kvUrl = process.env.KV_URL;
  
  if (redisUrl) {
    console.log(`   ✅ REDIS_URL установлен: ${redisUrl.substring(0, 20)}...`);
  } else {
    console.log("   ⚠️  REDIS_URL не установлен");
  }
  
  if (kvUrl) {
    console.log(`   ✅ KV_URL установлен: ${kvUrl.substring(0, 20)}...`);
  } else {
    console.log("   ⚠️  KV_URL не установлен");
  }
  
  const url = redisUrl || kvUrl;
  
  if (!url) {
    console.log("\n❌ Redis URL не настроен. Это нормально для локальной разработки!");
    console.log("\n📝 Чтобы включить Redis:");
    console.log("   1. Локально: docker run -d -p 6379:6379 redis:alpine");
    console.log("   2. Добавьте в .env.local: REDIS_URL=redis://localhost:6379");
    console.log("   3. Или на Vercel настройте Vercel KV Storage");
    return;
  }
  
  // Пытаемся подключиться
  console.log("\n2. Попытка подключения к Redis:");
  
  try {
    const Redis = require("ioredis");
    
    const client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      tls: url.startsWith("rediss://") ? {} : undefined,
    });
    
    client.on("error", (error) => {
      console.log(`   ⚠️  Redis error: ${error.message}`);
    });
    
    console.log("   🔄 Подключение...");
    await client.connect();
    
    console.log("   ✅ Подключение успешно!");
    
    // Тест записи/чтения
    console.log("\n3. Тест записи/чтения:");
    const testKey = "test-key-" + Date.now();
    const testValue = JSON.stringify({ test: "данные на русском", timestamp: Date.now() });
    
    await client.set(testKey, testValue, "EX", 60);
    console.log("   ✅ Данные записаны");
    
    const retrieved = await client.get(testKey);
    console.log("   ✅ Данные прочитаны:", JSON.parse(retrieved).test);
    
    await client.del(testKey);
    console.log("   ✅ Данные удалены");
    
    // Проверяем кэш RSS
    console.log("\n4. Проверка кэша RSS:");
    const rssCacheKeys = await client.keys("rss-cache:*");
    console.log(`   📦 Закэшировано RSS фидов: ${rssCacheKeys.length}`);
    
    if (rssCacheKeys.length > 0) {
      console.log("   Примеры:");
      rssCacheKeys.slice(0, 3).forEach(key => {
        console.log(`     - ${key.replace("rss-cache:", "")}`);
      });
    }
    
    await client.quit();
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Redis работает корректно!");
    
  } catch (error) {
    console.log(`   ❌ Ошибка: ${error.message}`);
    console.log("\n📝 Возможные причины:");
    console.log("   - Redis не запущен локально");
    console.log("   - Неправильный REDIS_URL");
    console.log("   - Проблемы с сетью/firewall");
    console.log("\n💡 Приложение будет работать без кэша");
  }
}

testRedis().catch(console.error);

