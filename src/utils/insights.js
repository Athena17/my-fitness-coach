import { getToday } from './dateUtils.js';

function getLast7DaysKeys() {
  const keys = [];
  const now = new Date(getToday() + 'T00:00:00');
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    keys.push(`${y}-${m}-${day}`);
  }
  return keys;
}

export function getInsights(entries, targets) {
  const weekKeys = getLast7DaysKeys();
  const weekEntries = entries.filter((e) => weekKeys.includes(e.dateKey));

  // Group by day
  const byDay = {};
  for (const key of weekKeys) byDay[key] = [];
  for (const e of weekEntries) {
    if (byDay[e.dateKey]) byDay[e.dateKey].push(e);
  }

  // Only consider days with logged data
  const activeDays = weekKeys.filter((k) => byDay[k].length > 0);
  if (activeDays.length < 2) return [];

  const dayCount = activeDays.length;

  // Per-day totals
  const dailyTotals = activeDays.map((k) => {
    const dayEntries = byDay[k];
    const kcal = dayEntries.reduce((s, e) => s + (e.kcal || 0), 0);
    const protein = dayEntries.reduce((s, e) => s + (e.protein || 0), 0);
    return { dateKey: k, kcal, protein, entries: dayEntries };
  });

  const avgKcal = Math.round(dailyTotals.reduce((s, d) => s + d.kcal, 0) / dayCount);
  const avgProtein = Math.round(dailyTotals.reduce((s, d) => s + d.protein, 0) / dayCount);
  const avgDeficit = Math.round(avgKcal - targets.kcal);
  const proteinMetDays = dailyTotals.filter((d) => d.protein >= targets.protein).length;
  const kcalOverDays = dailyTotals.filter((d) => d.kcal > targets.kcal).length;
  const proteinUnderDays = dailyTotals.filter((d) => d.protein < targets.protein).length;

  // Meal breakdown (which meal contributes most)
  const mealKcal = {};
  for (const d of dailyTotals) {
    for (const e of d.entries) {
      const meal = e.meal || 'Snack';
      mealKcal[meal] = (mealKcal[meal] || 0) + (e.kcal || 0);
    }
  }
  let topMeal = null;
  let topMealPct = 0;
  const totalKcal = dailyTotals.reduce((s, d) => s + d.kcal, 0);
  if (totalKcal > 0) {
    for (const [meal, kcal] of Object.entries(mealKcal)) {
      const pct = kcal / totalKcal;
      if (pct > topMealPct) { topMeal = meal; topMealPct = pct; }
    }
  }

  const insights = [];

  // Deficit/surplus insight
  if (avgDeficit < 0) {
    insights.push(`You are averaging ${avgDeficit} kcal/day below target this week.`);
  } else if (avgDeficit > 0) {
    insights.push(`You are averaging +${avgDeficit} kcal/day above target this week.`);
  }

  // Protein hit rate
  if (dayCount >= 3) {
    insights.push(`You hit your protein target ${proteinMetDays} out of ${dayCount} days.`);
  }

  // Pattern: consistently over calories
  if (kcalOverDays >= 4) {
    insights.push('You exceeded your calorie target on most days this week.');
  }

  // Pattern: consistently under protein
  if (proteinUnderDays >= 4) {
    const avgGap = Math.round(targets.protein - avgProtein);
    insights.push(`Your average protein intake is ${avgGap}g below target.`);
  }

  // Pattern: sustainable deficit
  if (avgDeficit >= -500 && avgDeficit <= -250) {
    insights.push('You are in a sustainable deficit range.');
  }

  // Top meal contributor
  if (topMeal && topMealPct >= 0.35) {
    insights.push(`${topMeal} contributes ${Math.round(topMealPct * 100)}% of your daily calories on average.`);
  }

  return insights.slice(0, 3);
}
