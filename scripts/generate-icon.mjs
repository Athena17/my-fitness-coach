/**
 * Generate a square app icon SVG from the Irada logo.
 *
 * The source logo is 1024×1536 (portrait). This script:
 * 1. Reads the logo SVG
 * 2. Extracts all <path> elements (the actual logo artwork)
 * 3. Wraps them in a 1024×1024 square SVG, vertically centered
 * 4. Writes to resources/icon.svg
 *
 * On macOS (Codemagic), convert to PNG with:
 *   rsvg-convert -w 1024 -h 1024 resources/icon.svg -o resources/icon.png
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const logoSvg = readFileSync(join(root, 'public', 'logo.svg'), 'utf8');

// Extract everything between the opening <svg ...> and closing </svg>
const innerMatch = logoSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
if (!innerMatch) {
  console.error('Could not parse logo SVG');
  process.exit(1);
}
const innerContent = innerMatch[1];

// The logo is 1024×1536. To center in a 1024×1024 square,
// we shift the content up by (1536-1024)/2 = 256px
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 256 1024 1024" width="1024" height="1024">
<rect x="0" y="256" width="1024" height="1024" fill="#f5f3f0"/>
${innerContent}
</svg>`;

mkdirSync(join(root, 'resources'), { recursive: true });
writeFileSync(join(root, 'resources', 'icon.svg'), iconSvg);
console.log('Generated resources/icon.svg (1024x1024 square)');
