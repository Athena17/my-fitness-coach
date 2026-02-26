/**
 * Centralized citation data for all health/science claims in Irada.
 * Each citation has a numeric key (for footnotes), a short label, full reference, and URL.
 */

export const CITATIONS = [
  {
    id: 1,
    key: 'mifflin',
    label: 'Mifflin-St Jeor BMR',
    reference: 'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241-247.',
    url: 'https://doi.org/10.1093/ajcn/51.2.241',
  },
  {
    id: 2,
    key: 'harris',
    label: 'Activity multipliers',
    reference: 'Harris JA, Benedict FG. A Biometric Study of Human Basal Metabolism. Proc Natl Acad Sci USA. 1918;4(12):370-373. Activity factors adapted from subsequent revisions.',
    url: 'https://doi.org/10.1073/pnas.4.12.370',
  },
  {
    id: 3,
    key: 'protein',
    label: 'Protein target (1.6 g/kg)',
    reference: 'Morton RW, Murphy KT, McKellar SR, et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med. 2018;52(6):376-384.',
    url: 'https://doi.org/10.1136/bjsports-2017-097608',
  },
  {
    id: 4,
    key: 'water',
    label: 'Water intake (35 ml/kg)',
    reference: 'European Food Safety Authority (EFSA). Scientific Opinion on Dietary Reference Values for water. EFSA Journal. 2010;8(3):1459.',
    url: 'https://doi.org/10.2903/j.efsa.2010.1459',
  },
  {
    id: 5,
    key: 'met',
    label: 'MET values & calorie burn',
    reference: 'Ainsworth BE, Haskell WL, Herrmann SD, et al. 2011 Compendium of Physical Activities: a second update of codes and MET values. Med Sci Sports Exerc. 2011;43(8):1575-1581.',
    url: 'https://doi.org/10.1249/MSS.0b013e31821ece12',
  },
  {
    id: 6,
    key: 'wishnofsky',
    label: '7,700 kcal per kg body weight',
    reference: 'Wishnofsky M. Caloric equivalents of gained or lost weight. Am J Clin Nutr. 1958;6(5):542-546.',
    url: 'https://doi.org/10.1093/ajcn/6.5.542',
  },
  {
    id: 7,
    key: 'cdc',
    label: 'Weight loss rate guidelines',
    reference: 'Centers for Disease Control and Prevention (CDC). Losing Weight: Getting Started. Updated 2024.',
    url: 'https://www.cdc.gov/healthy-weight/losing-weight/index.html',
  },
];

/** Look up a citation by its numeric id */
export function getCitation(id) {
  return CITATIONS.find(c => c.id === id);
}
