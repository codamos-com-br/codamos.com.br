/** pt-br date formatting matching the theme's `D MMMM YYYY` (formatDate). */

const MONTHS_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** e.g. "5 junho 2026" (Publii formatDate "D MMMM YYYY"). */
export const formatDate = (date: Date): string => {
  return `${date.getUTCDate()} ${MONTHS_PT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

/** ISO date (YYYY-MM-DD) for <time datetime>. */
export const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
