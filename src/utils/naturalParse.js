import foodDatabase from '../data/foodDatabase.js';

// TODO: Replace with API call

/**
 * Parse natural language food description and estimate nutrition.
 * Matches known foods from the database; unrecognized items get a dummy estimate.
 */
export function parseNaturalInput(text) {
  if (!text || !text.trim()) return null;

  const input = text.toLowerCase().trim();
  const matched = [];
  const matchedIndices = new Set();

  // Try to match each food in the database against the input
  for (const food of foodDatabase) {
    // Build keywords from the food name (strip parentheticals)
    const cleanName = food.name.replace(/\(.*?\)/g, '').trim().toLowerCase();
    const keywords = cleanName.split(/\s+/).filter((w) => w.length > 2);

    // Check if the primary keyword (first meaningful word) appears in the input
    const primaryKeyword = keywords[0];
    if (primaryKeyword && input.includes(primaryKeyword)) {
      // Count how many keywords match
      const matchCount = keywords.filter((kw) => input.includes(kw)).length;
      matched.push({ food, matchCount, keywordCount: keywords.length });
    }
  }

  // Sort by match quality (more keyword matches = better)
  matched.sort((a, b) => b.matchCount - a.matchCount);

  // Deduplicate: if two foods share a primary keyword, keep the best match
  const used = [];
  for (const m of matched) {
    const cleanName = m.food.name.replace(/\(.*?\)/g, '').trim().toLowerCase();
    const primary = cleanName.split(/\s+/)[0];
    if (!matchedIndices.has(primary)) {
      matchedIndices.add(primary);
      used.push(m.food);
    }
  }

  // Find unrecognized words that might be food items
  const allMatchedKeywords = new Set();
  for (const food of used) {
    const cleanName = food.name.replace(/\(.*?\)/g, '').trim().toLowerCase();
    cleanName.split(/\s+/).forEach((w) => allMatchedKeywords.add(w));
  }

  const stopWords = new Set([
    'with', 'and', 'a', 'an', 'the', 'some', 'of', 'in', 'on', 'for',
    'my', 'had', 'ate', 'two', 'three', 'four', 'five', 'big', 'small',
    'large', 'medium', 'little', 'bit', 'piece', 'pieces', 'cup', 'cups',
    'bowl', 'plate', 'serving', 'glass', 'slice', 'slices',
  ]);

  const inputWords = input.split(/[\s,]+/).filter((w) => w.length > 2);
  const unrecognized = inputWords.filter(
    (w) => !allMatchedKeywords.has(w) && !stopWords.has(w)
  );

  // Sum up nutrition from matched foods (use serving values)
  let totalKcal = 0;
  let totalProtein = 0;

  for (const food of used) {
    totalKcal += food.serving.kcal;
    totalProtein += food.serving.protein;
  }

  // Add dummy estimates for unrecognized items
  const unrecognizedCount = unrecognized.length > 0 && used.length === 0
    ? Math.max(1, unrecognized.length)
    : 0;

  if (used.length === 0 && unrecognized.length > 0) {
    // Nothing matched at all — give a rough per-item estimate
    totalKcal += unrecognizedCount * 150;
    totalProtein += unrecognizedCount * 5;
  }

  return {
    name: text.trim(),
    kcal: Math.round(totalKcal),
    protein: Math.round(totalProtein),
    servingSize: 1,
    servingUnit: 'g',
    matchedFoods: used.map((f) => f.name),
  };
}
