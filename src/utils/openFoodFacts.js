const API_BASE = 'https://world.openfoodfacts.net/api/v2/product';

/**
 * Look up a product by barcode from OpenFoodFacts.
 * Returns normalized nutrition data or null if not found.
 */
export async function lookupBarcode(barcode) {
  const cleaned = barcode.replace(/\D/g, '');
  if (!cleaned) return null;

  const res = await fetch(
    `${API_BASE}/${encodeURIComponent(cleaned)}.json?fields=product_name,nutriments,serving_size,serving_quantity`,
    { headers: { 'User-Agent': 'Irada-PWA/1.0 (https://github.com)' } }
  );

  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments || {};

  const per100g = {
    kcal: Math.round(n['energy-kcal_100g'] || (n.energy_100g ? n.energy_100g / 4.184 : 0)),
    protein: Math.round(n.proteins_100g || 0),
    carbs: Math.round(n.carbohydrates_100g || 0),
    fat: Math.round(n.fat_100g || 0),
  };

  // Per-serving: prefer API values, fall back to calculating from per100g + serving weight
  const servingGrams = p.serving_quantity || parseGrams(p.serving_size);
  const hasServingNutrition = n['energy-kcal_serving'] != null || n.energy_serving != null;

  let perServing;
  if (hasServingNutrition) {
    perServing = {
      kcal: Math.round(n['energy-kcal_serving'] || (n.energy_serving ? n.energy_serving / 4.184 : 0)),
      protein: Math.round(n.proteins_serving || 0),
      carbs: Math.round(n.carbohydrates_serving || 0),
      fat: Math.round(n.fat_serving || 0),
    };
  } else if (servingGrams) {
    const f = servingGrams / 100;
    perServing = {
      kcal: Math.round(per100g.kcal * f),
      protein: Math.round(per100g.protein * f),
      carbs: Math.round(per100g.carbs * f),
      fat: Math.round(per100g.fat * f),
    };
  } else {
    // No serving info — use per 100g as one serving
    perServing = { ...per100g };
  }

  return {
    name: p.product_name || 'Unknown product',
    barcode: cleaned,
    per100g,
    perServing,
    servingSize: p.serving_size || null,
    servingGrams: servingGrams || 100,
  };
}

/** Extract grams from a serving_size string like "30g", "1 scoop (31g)", "200ml" */
function parseGrams(str) {
  if (!str) return null;
  const match = str.match(/(\d+(?:\.\d+)?)\s*g(?:r|ram)?/i);
  return match ? Number(match[1]) : null;
}
