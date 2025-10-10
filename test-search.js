/**
 * Тестируем поиск по русским словам
 */

// Эмулируем функцию calculateSearchScore из feed-utils.ts
function calculateSearchScore(text, searchTerms, weight = 1) {
  const lowerText = text.toLowerCase();
  let score = 0;

  for (const term of searchTerms) {
    const lowerTerm = term.toLowerCase();

    // Exact phrase match - highest score
    if (lowerText.includes(lowerTerm)) {
      score += weight * 10;

      // Bonus for word boundary match (not part of larger word)
      // Use Unicode-aware word boundaries that work with Cyrillic and other scripts
      const escapedTerm = lowerTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Use negative lookahead/lookbehind with Unicode letter/number classes
      const regex = new RegExp(
        `(?<!\\p{L}|\\p{N})${escapedTerm}(?!\\p{L}|\\p{N})`,
        "gimu"
      );
      const matches = lowerText.match(regex);
      if (matches) {
        score += matches.length * weight * 5;
      }
    }

    // Partial word matches (for longer terms)
    if (lowerTerm.length > 4) {
      // Split by non-letter/non-number characters to get words
      const words = lowerText.split(/[^\p{L}\p{N}]+/u);
      for (const word of words) {
        if (word.includes(lowerTerm) || lowerTerm.includes(word)) {
          score += weight * 2;
        }
      }
    }
  }

  return score;
}

console.log("🔍 Тестирование поиска по словам\n");

// Тестовые данные
const testArticles = [
  { title: "Новые технологии искусственного интеллекта", summary: "ИИ меняет мир технологий" },
  { title: "AI and Machine Learning advances", summary: "Technology is evolving" },
  { title: "Квантовые компьютеры и их возможности", summary: "Будущее вычислительных технологий" },
  { title: "Блокчейн технологии в 2025 году", summary: "Криптовалюты и децентрализация" },
];

// Тесты поиска
const tests = [
  { query: "технологии", desc: "Поиск русского слова" },
  { query: "искусственный интеллект", desc: "Поиск русской фразы" },
  { query: "ИИ", desc: "Поиск русской аббревиатуры" },
  { query: "AI", desc: "Поиск английской аббревиатуры" },
  { query: "technology", desc: "Поиск английского слова" },
  { query: "технологии, ИИ", desc: "Множественные ключевые слова" },
];

tests.forEach(({ query, desc }, index) => {
  console.log(`Тест ${index + 1}: ${desc}`);
  console.log(`Запрос: "${query}"\n`);
  
  const searchTerms = query.split(/[,\n]/).map(t => t.trim().toLowerCase()).filter(Boolean);
  
  const results = testArticles.map(article => {
    let totalScore = 0;
    totalScore += calculateSearchScore(article.title, searchTerms, 3);
    totalScore += calculateSearchScore(article.summary, searchTerms, 2);
    return { article, score: totalScore };
  })
  .filter(({ score }) => score > 0)
  .sort((a, b) => b.score - a.score);
  
  if (results.length === 0) {
    console.log("  ❌ Ничего не найдено\n");
  } else {
    console.log(`  ✅ Найдено ${results.length} статей:`);
    results.forEach(({ article, score }) => {
      console.log(`     [${score.toFixed(0)}] ${article.title}`);
    });
    console.log();
  }
});

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("✅ Все тесты поиска завершены!");

