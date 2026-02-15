// Each ingredient: id, name, kcalPer100g, proteinPer100g, portions
// portions: array of { label, grams } — first is the default unit shown
// All items also get a "g" option appended automatically in the UI
const ingredientsDatabase = [
  // Proteins — Poultry
  { id: 1, name: 'Chicken breast', kcalPer100g: 165, proteinPer100g: 31, portions: [{ label: 'breast', grams: 120 }] },
  { id: 2, name: 'Chicken thigh', kcalPer100g: 209, proteinPer100g: 26, portions: [{ label: 'thigh', grams: 115 }] },
  { id: 3, name: 'Turkey breast', kcalPer100g: 135, proteinPer100g: 30, portions: [{ label: 'slice', grams: 28 }] },
  { id: 4, name: 'Ground turkey', kcalPer100g: 170, proteinPer100g: 21, portions: [{ label: 'cup', grams: 130 }] },

  // Proteins — Red meat
  { id: 5, name: 'Ground beef (90% lean)', kcalPer100g: 176, proteinPer100g: 20, portions: [{ label: 'patty', grams: 113 }] },
  { id: 6, name: 'Ground beef (80% lean)', kcalPer100g: 254, proteinPer100g: 17, portions: [{ label: 'patty', grams: 113 }] },
  { id: 7, name: 'Beef steak (sirloin)', kcalPer100g: 206, proteinPer100g: 26, portions: [{ label: 'steak', grams: 200 }] },
  { id: 8, name: 'Lamb chop', kcalPer100g: 258, proteinPer100g: 24, portions: [{ label: 'chop', grams: 100 }] },
  { id: 9, name: 'Pork chop', kcalPer100g: 231, proteinPer100g: 26, portions: [{ label: 'chop', grams: 120 }] },
  { id: 10, name: 'Pork tenderloin', kcalPer100g: 143, proteinPer100g: 26, portions: [{ label: 'piece', grams: 120 }] },
  { id: 11, name: 'Bacon', kcalPer100g: 541, proteinPer100g: 37, portions: [{ label: 'slice', grams: 8 }] },

  // Proteins — Seafood
  { id: 12, name: 'Salmon', kcalPer100g: 208, proteinPer100g: 20, portions: [{ label: 'fillet', grams: 150 }] },
  { id: 13, name: 'Tuna (canned)', kcalPer100g: 116, proteinPer100g: 26, portions: [{ label: 'can', grams: 85 }] },
  { id: 14, name: 'Shrimp', kcalPer100g: 99, proteinPer100g: 24, portions: [{ label: 'piece', grams: 6 }, { label: 'cup', grams: 145 }] },
  { id: 15, name: 'Cod', kcalPer100g: 82, proteinPer100g: 18, portions: [{ label: 'fillet', grams: 150 }] },
  { id: 16, name: 'Tilapia', kcalPer100g: 96, proteinPer100g: 20, portions: [{ label: 'fillet', grams: 115 }] },

  // Eggs & Dairy
  { id: 17, name: 'Egg (whole)', kcalPer100g: 155, proteinPer100g: 13, portions: [{ label: 'egg', grams: 50 }] },
  { id: 18, name: 'Egg white', kcalPer100g: 52, proteinPer100g: 11, portions: [{ label: 'white', grams: 33 }] },
  { id: 19, name: 'Milk (whole)', kcalPer100g: 61, proteinPer100g: 3.2, portions: [{ label: 'cup', grams: 244 }, { label: 'tbsp', grams: 15 }] },
  { id: 20, name: 'Milk (skim)', kcalPer100g: 34, proteinPer100g: 3.4, portions: [{ label: 'cup', grams: 245 }, { label: 'tbsp', grams: 15 }] },
  { id: 21, name: 'Greek yogurt', kcalPer100g: 73, proteinPer100g: 10, portions: [{ label: 'cup', grams: 170 }, { label: 'tbsp', grams: 15 }] },
  { id: 22, name: 'Yogurt (plain)', kcalPer100g: 61, proteinPer100g: 3.5, portions: [{ label: 'cup', grams: 245 }] },
  { id: 23, name: 'Cottage cheese', kcalPer100g: 84, proteinPer100g: 11, portions: [{ label: 'cup', grams: 226 }, { label: 'tbsp', grams: 14 }] },
  { id: 24, name: 'Cheddar cheese', kcalPer100g: 403, proteinPer100g: 25, portions: [{ label: 'slice', grams: 28 }, { label: 'cup shredded', grams: 113 }] },
  { id: 25, name: 'Mozzarella', kcalPer100g: 280, proteinPer100g: 28, portions: [{ label: 'slice', grams: 28 }, { label: 'cup shredded', grams: 113 }] },
  { id: 26, name: 'Parmesan', kcalPer100g: 431, proteinPer100g: 38, portions: [{ label: 'tbsp', grams: 5 }] },
  { id: 27, name: 'Cream cheese', kcalPer100g: 342, proteinPer100g: 6, portions: [{ label: 'tbsp', grams: 14.5 }] },
  { id: 28, name: 'Butter', kcalPer100g: 717, proteinPer100g: 0.9, portions: [{ label: 'tbsp', grams: 14 }, { label: 'tsp', grams: 5 }] },
  { id: 29, name: 'Heavy cream', kcalPer100g: 340, proteinPer100g: 2.1, portions: [{ label: 'tbsp', grams: 15 }, { label: 'cup', grams: 240 }] },
  { id: 30, name: 'Whey protein powder', kcalPer100g: 400, proteinPer100g: 80, portions: [{ label: 'scoop', grams: 30 }] },

  // Grains & Starches
  { id: 31, name: 'White rice (cooked)', kcalPer100g: 130, proteinPer100g: 2.7, portions: [{ label: 'cup', grams: 186 }] },
  { id: 32, name: 'Brown rice (cooked)', kcalPer100g: 112, proteinPer100g: 2.3, portions: [{ label: 'cup', grams: 195 }] },
  { id: 33, name: 'Pasta (cooked)', kcalPer100g: 131, proteinPer100g: 5, portions: [{ label: 'cup', grams: 140 }] },
  { id: 34, name: 'Bread (white)', kcalPer100g: 265, proteinPer100g: 9, portions: [{ label: 'slice', grams: 25 }] },
  { id: 35, name: 'Bread (whole wheat)', kcalPer100g: 247, proteinPer100g: 13, portions: [{ label: 'slice', grams: 28 }] },
  { id: 36, name: 'Oats (dry)', kcalPer100g: 389, proteinPer100g: 17, portions: [{ label: 'cup', grams: 80 }, { label: 'tbsp', grams: 5 }] },
  { id: 37, name: 'Oatmeal (cooked)', kcalPer100g: 71, proteinPer100g: 2.5, portions: [{ label: 'cup', grams: 234 }] },
  { id: 38, name: 'Tortilla (flour)', kcalPer100g: 312, proteinPer100g: 8, portions: [{ label: 'tortilla', grams: 45 }] },
  { id: 39, name: 'Quinoa (cooked)', kcalPer100g: 120, proteinPer100g: 4.4, portions: [{ label: 'cup', grams: 185 }] },
  { id: 40, name: 'Couscous (cooked)', kcalPer100g: 112, proteinPer100g: 3.8, portions: [{ label: 'cup', grams: 157 }] },
  { id: 41, name: 'Potato', kcalPer100g: 77, proteinPer100g: 2, portions: [{ label: 'medium', grams: 150 }] },
  { id: 42, name: 'Sweet potato', kcalPer100g: 86, proteinPer100g: 1.6, portions: [{ label: 'medium', grams: 130 }] },
  { id: 43, name: 'Corn', kcalPer100g: 86, proteinPer100g: 3.3, portions: [{ label: 'ear', grams: 90 }, { label: 'cup', grams: 145 }] },

  // Legumes
  { id: 44, name: 'Lentils (cooked)', kcalPer100g: 116, proteinPer100g: 9, portions: [{ label: 'cup', grams: 198 }] },
  { id: 45, name: 'Chickpeas (cooked)', kcalPer100g: 164, proteinPer100g: 8.9, portions: [{ label: 'cup', grams: 164 }] },
  { id: 46, name: 'Black beans (cooked)', kcalPer100g: 132, proteinPer100g: 8.9, portions: [{ label: 'cup', grams: 172 }] },
  { id: 47, name: 'Kidney beans (cooked)', kcalPer100g: 127, proteinPer100g: 8.7, portions: [{ label: 'cup', grams: 177 }] },
  { id: 48, name: 'Edamame', kcalPer100g: 121, proteinPer100g: 11, portions: [{ label: 'cup', grams: 155 }] },
  { id: 49, name: 'Tofu (firm)', kcalPer100g: 76, proteinPer100g: 8, portions: [{ label: 'block', grams: 252 }, { label: 'cup', grams: 126 }] },

  // Vegetables
  { id: 50, name: 'Broccoli', kcalPer100g: 34, proteinPer100g: 2.8, portions: [{ label: 'cup', grams: 91 }, { label: 'head', grams: 600 }] },
  { id: 51, name: 'Spinach', kcalPer100g: 23, proteinPer100g: 2.9, portions: [{ label: 'cup raw', grams: 30 }, { label: 'cup cooked', grams: 180 }] },
  { id: 52, name: 'Tomato', kcalPer100g: 18, proteinPer100g: 0.9, portions: [{ label: 'medium', grams: 123 }, { label: 'cup', grams: 180 }] },
  { id: 53, name: 'Onion', kcalPer100g: 40, proteinPer100g: 1.1, portions: [{ label: 'medium', grams: 110 }, { label: 'cup', grams: 160 }] },
  { id: 54, name: 'Bell pepper', kcalPer100g: 31, proteinPer100g: 1, portions: [{ label: 'medium', grams: 120 }, { label: 'cup', grams: 150 }] },
  { id: 55, name: 'Carrot', kcalPer100g: 41, proteinPer100g: 0.9, portions: [{ label: 'medium', grams: 61 }, { label: 'cup', grams: 128 }] },
  { id: 56, name: 'Cucumber', kcalPer100g: 15, proteinPer100g: 0.7, portions: [{ label: 'medium', grams: 200 }, { label: 'cup', grams: 119 }] },
  { id: 57, name: 'Lettuce', kcalPer100g: 15, proteinPer100g: 1.4, portions: [{ label: 'cup', grams: 36 }, { label: 'leaf', grams: 5 }] },
  { id: 58, name: 'Mushrooms', kcalPer100g: 22, proteinPer100g: 3.1, portions: [{ label: 'cup', grams: 70 }, { label: 'piece', grams: 18 }] },
  { id: 59, name: 'Zucchini', kcalPer100g: 17, proteinPer100g: 1.2, portions: [{ label: 'medium', grams: 196 }, { label: 'cup', grams: 113 }] },
  { id: 60, name: 'Avocado', kcalPer100g: 160, proteinPer100g: 2, portions: [{ label: 'avocado', grams: 150 }, { label: 'half', grams: 75 }] },
  { id: 61, name: 'Green beans', kcalPer100g: 31, proteinPer100g: 1.8, portions: [{ label: 'cup', grams: 125 }] },
  { id: 62, name: 'Cauliflower', kcalPer100g: 25, proteinPer100g: 1.9, portions: [{ label: 'cup', grams: 107 }] },
  { id: 63, name: 'Cabbage', kcalPer100g: 25, proteinPer100g: 1.3, portions: [{ label: 'cup', grams: 89 }] },

  // Fruits
  { id: 64, name: 'Banana', kcalPer100g: 89, proteinPer100g: 1.1, portions: [{ label: 'medium', grams: 118 }] },
  { id: 65, name: 'Apple', kcalPer100g: 52, proteinPer100g: 0.3, portions: [{ label: 'medium', grams: 182 }] },
  { id: 66, name: 'Orange', kcalPer100g: 47, proteinPer100g: 0.9, portions: [{ label: 'medium', grams: 131 }] },
  { id: 67, name: 'Strawberries', kcalPer100g: 32, proteinPer100g: 0.7, portions: [{ label: 'cup', grams: 152 }, { label: 'piece', grams: 12 }] },
  { id: 68, name: 'Blueberries', kcalPer100g: 57, proteinPer100g: 0.7, portions: [{ label: 'cup', grams: 148 }] },
  { id: 69, name: 'Grapes', kcalPer100g: 69, proteinPer100g: 0.7, portions: [{ label: 'cup', grams: 151 }] },
  { id: 70, name: 'Mango', kcalPer100g: 60, proteinPer100g: 0.8, portions: [{ label: 'cup', grams: 165 }, { label: 'mango', grams: 200 }] },
  { id: 71, name: 'Watermelon', kcalPer100g: 30, proteinPer100g: 0.6, portions: [{ label: 'cup', grams: 152 }, { label: 'slice', grams: 280 }] },

  // Nuts & Seeds
  { id: 72, name: 'Almonds', kcalPer100g: 579, proteinPer100g: 21, portions: [{ label: 'handful', grams: 28 }, { label: 'cup', grams: 143 }] },
  { id: 73, name: 'Peanuts', kcalPer100g: 567, proteinPer100g: 26, portions: [{ label: 'handful', grams: 28 }, { label: 'cup', grams: 146 }] },
  { id: 74, name: 'Walnuts', kcalPer100g: 654, proteinPer100g: 15, portions: [{ label: 'handful', grams: 28 }, { label: 'cup', grams: 117 }] },
  { id: 75, name: 'Cashews', kcalPer100g: 553, proteinPer100g: 18, portions: [{ label: 'handful', grams: 28 }, { label: 'cup', grams: 137 }] },
  { id: 76, name: 'Peanut butter', kcalPer100g: 588, proteinPer100g: 25, portions: [{ label: 'tbsp', grams: 16 }] },
  { id: 77, name: 'Chia seeds', kcalPer100g: 486, proteinPer100g: 17, portions: [{ label: 'tbsp', grams: 12 }] },
  { id: 78, name: 'Flax seeds', kcalPer100g: 534, proteinPer100g: 18, portions: [{ label: 'tbsp', grams: 7 }] },
  { id: 79, name: 'Sunflower seeds', kcalPer100g: 584, proteinPer100g: 21, portions: [{ label: 'tbsp', grams: 9 }, { label: 'cup', grams: 140 }] },

  // Oils & Fats
  { id: 80, name: 'Olive oil', kcalPer100g: 884, proteinPer100g: 0, portions: [{ label: 'tbsp', grams: 14 }, { label: 'tsp', grams: 5 }] },
  { id: 81, name: 'Coconut oil', kcalPer100g: 862, proteinPer100g: 0, portions: [{ label: 'tbsp', grams: 14 }, { label: 'tsp', grams: 5 }] },
  { id: 82, name: 'Vegetable oil', kcalPer100g: 884, proteinPer100g: 0, portions: [{ label: 'tbsp', grams: 14 }, { label: 'tsp', grams: 5 }] },

  // Other common items
  { id: 83, name: 'Honey', kcalPer100g: 304, proteinPer100g: 0.3, portions: [{ label: 'tbsp', grams: 21 }, { label: 'tsp', grams: 7 }] },
  { id: 84, name: 'Sugar', kcalPer100g: 387, proteinPer100g: 0, portions: [{ label: 'tbsp', grams: 12.5 }, { label: 'tsp', grams: 4 }] },
  { id: 85, name: 'Flour (all-purpose)', kcalPer100g: 364, proteinPer100g: 10, portions: [{ label: 'cup', grams: 125 }, { label: 'tbsp', grams: 8 }] },
  { id: 86, name: 'Dark chocolate', kcalPer100g: 546, proteinPer100g: 5, portions: [{ label: 'square', grams: 10 }, { label: 'bar', grams: 40 }] },
  { id: 87, name: 'Hummus', kcalPer100g: 166, proteinPer100g: 8, portions: [{ label: 'tbsp', grams: 15 }, { label: 'cup', grams: 246 }] },
  { id: 88, name: 'Sour cream', kcalPer100g: 193, proteinPer100g: 2.4, portions: [{ label: 'tbsp', grams: 12 }] },
  { id: 89, name: 'Mayonnaise', kcalPer100g: 680, proteinPer100g: 1, portions: [{ label: 'tbsp', grams: 14 }, { label: 'tsp', grams: 5 }] },
  { id: 90, name: 'Ketchup', kcalPer100g: 112, proteinPer100g: 1.7, portions: [{ label: 'tbsp', grams: 17 }, { label: 'tsp', grams: 6 }] },
  { id: 91, name: 'Soy sauce', kcalPer100g: 53, proteinPer100g: 8.1, portions: [{ label: 'tbsp', grams: 18 }, { label: 'tsp', grams: 6 }] },
];

export default ingredientsDatabase;
