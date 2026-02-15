// Each food has: name, category, per100g { kcal, protein }, serving { size, unit, label, kcal, protein }
const foodDatabase = [
  // Proteins
  { name: 'Chicken Breast (cooked)', category: 'Protein', per100g: { kcal: 165, protein: 31 }, serving: { size: 120, unit: 'g', label: '1 breast', kcal: 198, protein: 37.2 } },
  { name: 'Salmon (cooked)', category: 'Protein', per100g: { kcal: 208, protein: 20 }, serving: { size: 150, unit: 'g', label: '1 fillet', kcal: 312, protein: 30 } },
  { name: 'Tuna (canned in water)', category: 'Protein', per100g: { kcal: 116, protein: 26 }, serving: { size: 85, unit: 'g', label: '1 can', kcal: 99, protein: 22.1 } },
  { name: 'Ground Beef (90% lean)', category: 'Protein', per100g: { kcal: 176, protein: 20 }, serving: { size: 113, unit: 'g', label: '1 patty', kcal: 199, protein: 22.6 } },
  { name: 'Turkey Breast (cooked)', category: 'Protein', per100g: { kcal: 135, protein: 30 }, serving: { size: 85, unit: 'g', label: '3 oz', kcal: 115, protein: 25.5 } },
  { name: 'Shrimp (cooked)', category: 'Protein', per100g: { kcal: 99, protein: 24 }, serving: { size: 85, unit: 'g', label: '3 oz', kcal: 84, protein: 20.4 } },
  { name: 'Pork Chop (cooked)', category: 'Protein', per100g: { kcal: 231, protein: 26 }, serving: { size: 120, unit: 'g', label: '1 chop', kcal: 277, protein: 31.2 } },
  { name: 'Tofu (firm)', category: 'Protein', per100g: { kcal: 76, protein: 8 }, serving: { size: 126, unit: 'g', label: '1/2 block', kcal: 96, protein: 10.1 } },

  // Eggs & Dairy
  { name: 'Egg (whole, large)', category: 'Dairy & Eggs', per100g: { kcal: 155, protein: 13 }, serving: { size: 50, unit: 'g', label: '1 egg', kcal: 78, protein: 6.3 } },
  { name: 'Egg White', category: 'Dairy & Eggs', per100g: { kcal: 52, protein: 11 }, serving: { size: 33, unit: 'g', label: '1 white', kcal: 17, protein: 3.6 } },
  { name: 'Greek Yogurt (plain, 2%)', category: 'Dairy & Eggs', per100g: { kcal: 73, protein: 10 }, serving: { size: 170, unit: 'g', label: '1 cup', kcal: 124, protein: 17 } },
  { name: 'Cottage Cheese (2%)', category: 'Dairy & Eggs', per100g: { kcal: 84, protein: 11 }, serving: { size: 113, unit: 'g', label: '1/2 cup', kcal: 95, protein: 12.4 } },
  { name: 'Cheddar Cheese', category: 'Dairy & Eggs', per100g: { kcal: 403, protein: 25 }, serving: { size: 28, unit: 'g', label: '1 slice', kcal: 113, protein: 7 } },
  { name: 'Mozzarella Cheese', category: 'Dairy & Eggs', per100g: { kcal: 280, protein: 28 }, serving: { size: 28, unit: 'g', label: '1 oz', kcal: 78, protein: 7.8 } },
  { name: 'Whole Milk', category: 'Dairy & Eggs', per100g: { kcal: 61, protein: 3.2 }, serving: { size: 244, unit: 'ml', label: '1 cup', kcal: 149, protein: 7.8 } },
  { name: 'Whey Protein Powder', category: 'Dairy & Eggs', per100g: { kcal: 400, protein: 80 }, serving: { size: 30, unit: 'g', label: '1 scoop', kcal: 120, protein: 24 } },

  // Grains & Bread
  { name: 'White Rice (cooked)', category: 'Grains', per100g: { kcal: 130, protein: 2.7 }, serving: { size: 186, unit: 'g', label: '1 cup', kcal: 242, protein: 5 } },
  { name: 'Brown Rice (cooked)', category: 'Grains', per100g: { kcal: 112, protein: 2.3 }, serving: { size: 195, unit: 'g', label: '1 cup', kcal: 218, protein: 4.5 } },
  { name: 'Pasta (cooked)', category: 'Grains', per100g: { kcal: 131, protein: 5 }, serving: { size: 140, unit: 'g', label: '1 cup', kcal: 183, protein: 7 } },
  { name: 'Whole Wheat Bread', category: 'Grains', per100g: { kcal: 247, protein: 13 }, serving: { size: 28, unit: 'g', label: '1 slice', kcal: 69, protein: 3.6 } },
  { name: 'White Bread', category: 'Grains', per100g: { kcal: 265, protein: 9 }, serving: { size: 25, unit: 'g', label: '1 slice', kcal: 66, protein: 2.3 } },
  { name: 'Oatmeal (cooked)', category: 'Grains', per100g: { kcal: 71, protein: 2.5 }, serving: { size: 234, unit: 'g', label: '1 cup', kcal: 166, protein: 5.9 } },
  { name: 'Tortilla (flour, 8")', category: 'Grains', per100g: { kcal: 312, protein: 8 }, serving: { size: 45, unit: 'g', label: '1 tortilla', kcal: 140, protein: 3.6 } },
  { name: 'Quinoa (cooked)', category: 'Grains', per100g: { kcal: 120, protein: 4.4 }, serving: { size: 185, unit: 'g', label: '1 cup', kcal: 222, protein: 8.1 } },

  // Fruits
  { name: 'Banana', category: 'Fruits', per100g: { kcal: 89, protein: 1.1 }, serving: { size: 118, unit: 'g', label: '1 medium', kcal: 105, protein: 1.3 } },
  { name: 'Apple', category: 'Fruits', per100g: { kcal: 52, protein: 0.3 }, serving: { size: 182, unit: 'g', label: '1 medium', kcal: 95, protein: 0.5 } },
  { name: 'Strawberries', category: 'Fruits', per100g: { kcal: 32, protein: 0.7 }, serving: { size: 152, unit: 'g', label: '1 cup', kcal: 49, protein: 1.1 } },
  { name: 'Blueberries', category: 'Fruits', per100g: { kcal: 57, protein: 0.7 }, serving: { size: 148, unit: 'g', label: '1 cup', kcal: 84, protein: 1 } },
  { name: 'Orange', category: 'Fruits', per100g: { kcal: 47, protein: 0.9 }, serving: { size: 131, unit: 'g', label: '1 medium', kcal: 62, protein: 1.2 } },
  { name: 'Grapes', category: 'Fruits', per100g: { kcal: 69, protein: 0.7 }, serving: { size: 151, unit: 'g', label: '1 cup', kcal: 104, protein: 1.1 } },
  { name: 'Avocado', category: 'Fruits', per100g: { kcal: 160, protein: 2 }, serving: { size: 68, unit: 'g', label: '1/2 avocado', kcal: 109, protein: 1.4 } },

  // Vegetables
  { name: 'Broccoli (cooked)', category: 'Vegetables', per100g: { kcal: 35, protein: 2.4 }, serving: { size: 156, unit: 'g', label: '1 cup', kcal: 55, protein: 3.7 } },
  { name: 'Spinach (raw)', category: 'Vegetables', per100g: { kcal: 23, protein: 2.9 }, serving: { size: 30, unit: 'g', label: '1 cup', kcal: 7, protein: 0.9 } },
  { name: 'Sweet Potato (baked)', category: 'Vegetables', per100g: { kcal: 90, protein: 2 }, serving: { size: 114, unit: 'g', label: '1 medium', kcal: 103, protein: 2.3 } },
  { name: 'Potato (baked)', category: 'Vegetables', per100g: { kcal: 93, protein: 2.5 }, serving: { size: 173, unit: 'g', label: '1 medium', kcal: 161, protein: 4.3 } },
  { name: 'Carrot (raw)', category: 'Vegetables', per100g: { kcal: 41, protein: 0.9 }, serving: { size: 61, unit: 'g', label: '1 medium', kcal: 25, protein: 0.6 } },
  { name: 'Tomato', category: 'Vegetables', per100g: { kcal: 18, protein: 0.9 }, serving: { size: 123, unit: 'g', label: '1 medium', kcal: 22, protein: 1.1 } },
  { name: 'Mixed Salad Greens', category: 'Vegetables', per100g: { kcal: 17, protein: 1.5 }, serving: { size: 85, unit: 'g', label: '3 cups', kcal: 14, protein: 1.3 } },
  { name: 'Bell Pepper', category: 'Vegetables', per100g: { kcal: 31, protein: 1 }, serving: { size: 119, unit: 'g', label: '1 medium', kcal: 37, protein: 1.2 } },

  // Legumes & Nuts
  { name: 'Black Beans (cooked)', category: 'Legumes & Nuts', per100g: { kcal: 132, protein: 8.9 }, serving: { size: 172, unit: 'g', label: '1 cup', kcal: 227, protein: 15.2 } },
  { name: 'Chickpeas (cooked)', category: 'Legumes & Nuts', per100g: { kcal: 164, protein: 8.9 }, serving: { size: 164, unit: 'g', label: '1 cup', kcal: 269, protein: 14.5 } },
  { name: 'Lentils (cooked)', category: 'Legumes & Nuts', per100g: { kcal: 116, protein: 9 }, serving: { size: 198, unit: 'g', label: '1 cup', kcal: 230, protein: 17.9 } },
  { name: 'Almonds', category: 'Legumes & Nuts', per100g: { kcal: 579, protein: 21 }, serving: { size: 28, unit: 'g', label: '1 oz (23 almonds)', kcal: 162, protein: 5.9 } },
  { name: 'Peanut Butter', category: 'Legumes & Nuts', per100g: { kcal: 588, protein: 25 }, serving: { size: 32, unit: 'g', label: '2 tbsp', kcal: 188, protein: 8 } },
  { name: 'Walnuts', category: 'Legumes & Nuts', per100g: { kcal: 654, protein: 15 }, serving: { size: 28, unit: 'g', label: '1 oz', kcal: 183, protein: 4.3 } },

  // Fats & Oils
  { name: 'Olive Oil', category: 'Fats & Oils', per100g: { kcal: 884, protein: 0 }, serving: { size: 14, unit: 'ml', label: '1 tbsp', kcal: 124, protein: 0 } },
  { name: 'Butter', category: 'Fats & Oils', per100g: { kcal: 717, protein: 0.9 }, serving: { size: 14, unit: 'g', label: '1 tbsp', kcal: 100, protein: 0.1 } },
  { name: 'Coconut Oil', category: 'Fats & Oils', per100g: { kcal: 862, protein: 0 }, serving: { size: 14, unit: 'ml', label: '1 tbsp', kcal: 121, protein: 0 } },

  // Snacks & Misc
  { name: 'Protein Bar (average)', category: 'Snacks', per100g: { kcal: 350, protein: 30 }, serving: { size: 60, unit: 'g', label: '1 bar', kcal: 210, protein: 18 } },
  { name: 'Granola Bar', category: 'Snacks', per100g: { kcal: 471, protein: 7 }, serving: { size: 35, unit: 'g', label: '1 bar', kcal: 165, protein: 2.5 } },
  { name: 'Dark Chocolate (70%)', category: 'Snacks', per100g: { kcal: 598, protein: 7.8 }, serving: { size: 28, unit: 'g', label: '1 oz', kcal: 167, protein: 2.2 } },
  { name: 'Trail Mix', category: 'Snacks', per100g: { kcal: 462, protein: 14 }, serving: { size: 40, unit: 'g', label: '1/4 cup', kcal: 185, protein: 5.6 } },
  { name: 'Rice Cakes', category: 'Snacks', per100g: { kcal: 387, protein: 8 }, serving: { size: 9, unit: 'g', label: '1 cake', kcal: 35, protein: 0.7 } },
  { name: 'Hummus', category: 'Snacks', per100g: { kcal: 166, protein: 8 }, serving: { size: 30, unit: 'g', label: '2 tbsp', kcal: 50, protein: 2.4 } },

  // Beverages
  { name: 'Orange Juice', category: 'Beverages', per100g: { kcal: 45, protein: 0.7 }, serving: { size: 248, unit: 'ml', label: '1 cup', kcal: 112, protein: 1.7 } },
  { name: 'Coca-Cola', category: 'Beverages', per100g: { kcal: 42, protein: 0 }, serving: { size: 355, unit: 'ml', label: '1 can', kcal: 140, protein: 0 } },
  { name: 'Beer (regular)', category: 'Beverages', per100g: { kcal: 43, protein: 0.5 }, serving: { size: 355, unit: 'ml', label: '1 can', kcal: 153, protein: 1.6 } },
  { name: 'Coffee (black)', category: 'Beverages', per100g: { kcal: 2, protein: 0.3 }, serving: { size: 237, unit: 'ml', label: '1 cup', kcal: 5, protein: 0.7 } },
  { name: 'Smoothie (fruit, average)', category: 'Beverages', per100g: { kcal: 54, protein: 1 }, serving: { size: 300, unit: 'ml', label: '1 glass', kcal: 162, protein: 3 } },

  // Fast food / Prepared
  { name: 'Pizza Slice (cheese)', category: 'Prepared', per100g: { kcal: 266, protein: 11 }, serving: { size: 107, unit: 'g', label: '1 slice', kcal: 285, protein: 11.8 } },
  { name: 'Burger (fast food, single)', category: 'Prepared', per100g: { kcal: 250, protein: 13 }, serving: { size: 200, unit: 'g', label: '1 burger', kcal: 500, protein: 26 } },
  { name: 'French Fries (medium)', category: 'Prepared', per100g: { kcal: 312, protein: 3.4 }, serving: { size: 117, unit: 'g', label: '1 medium', kcal: 365, protein: 4 } },
  { name: 'Chicken Nuggets', category: 'Prepared', per100g: { kcal: 296, protein: 15 }, serving: { size: 90, unit: 'g', label: '6 pieces', kcal: 266, protein: 13.5 } },
];

export default foodDatabase;
