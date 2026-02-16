export function getEmoji(name) {
  const n = name.toLowerCase();
  if (/oat|porridge/.test(n)) return '🥣';
  if (/chicken/.test(n)) return '🍗';
  if (/salad|greens/.test(n)) return '🥗';
  if (/rice/.test(n)) return '🍚';
  if (/egg/.test(n)) return '🍳';
  if (/sandwich|wrap/.test(n)) return '🥪';
  if (/pasta|noodle/.test(n)) return '🍝';
  if (/steak|beef/.test(n)) return '🥩';
  if (/fish|salmon/.test(n)) return '🐟';
  if (/coffee/.test(n)) return '☕';
  if (/smoothie|shake/.test(n)) return '🥤';
  if (/pizza/.test(n)) return '🍕';
  if (/soup/.test(n)) return '🍲';
  if (/bread|toast/.test(n)) return '🍞';
  if (/yogurt/.test(n)) return '🫐';
  if (/fruit|apple|banana/.test(n)) return '🍎';
  return '🍽️';
}
