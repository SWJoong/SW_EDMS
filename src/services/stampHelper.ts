/**
 * Generates an SVG Data URL representing an official Korean circular red stamp (인장/직인)
 * @param name User name or stamp label (e.g. "김관장", "홍길동")
 * @returns SVG Data URL string for image src
 */
export function generateDefaultStampSvg(name: string): string {
  const shortName = name.length > 3 ? name.slice(0, 3) : name;
  const stampText = shortName + '인';

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="44" stroke="#DC2626" stroke-width="5" fill="none" />
    <circle cx="50" cy="50" r="38" stroke="#DC2626" stroke-width="1.5" stroke-dasharray="3,2" fill="none" opacity="0.7" />
    <text x="50" y="58" font-family="'Batang', 'Gungsuh', 'Noto Serif KR', serif" font-weight="900" font-size="24" fill="#DC2626" text-anchor="middle" letter-spacing="1">
      ${stampText}
    </text>
  </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
