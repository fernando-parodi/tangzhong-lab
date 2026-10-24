/**
 * Tangzhong Lab — dependency-free recipe mathematics.
 * All quantities use grams. Flour is the 100% baker's-percentage reference.
 * The source recipe yields 697 g: flour 400 + water 286 + salt 7 + yeast 4.
 */
export const BASE = Object.freeze({
  flour: 400,
  water: 286,
  salt: 7,
  poolishYeast: 0.8,
  finalYeast: 3.2,
  tangzhongFlourPct: 0.15,
  tangzhongWaterPct: 0.30,
  poolishFlourPct: 0.20,
  poolishWaterPct: 0.20,
  finalFlourPct: 0.65,
  finalWaterPct: 0.215,
  saltPct: 0.0175,
  poolishYeastPct: 0.002,
  finalYeastPct: 0.008,
});

export const PROFILES = Object.freeze({
  bread: { label: 'Artisan bread', yeastAdjustment: 'original' },
  pizzaSameDay: { label: 'Pizza · same-day', yeastAdjustment: 'original' },
  pizzaOvernight: { label: 'Pizza · overnight', yeastAdjustment: 'no-final-yeast' },
});

function validPositive(n, min, max) {
  return Number.isFinite(n) && n >= min && n <= max;
}

export function calculateRecipe({ mode = 'bread', profile = 'same-day', count = 1, pieceWeight = 697 } = {}) {
  const n = Number(count);
  const grams = Number(pieceWeight);
  if (!validPositive(n, 1, 40) || !Number.isInteger(n)) throw new RangeError('Number of pieces must be a whole number from 1 to 40.');
  if (!validPositive(grams, 100, 2000)) throw new RangeError('Piece weight must be 100–2,000 g.');
  if (!['bread', 'pizza'].includes(mode)) throw new RangeError('Unknown recipe mode.');
  if (!['same-day', 'overnight'].includes(profile)) throw new RangeError('Unknown fermentation profile.');

  const overnight = mode === 'pizza' && profile === 'overnight';
  const poolishYeastPct = BASE.poolishYeastPct;
  const finalYeastPct = overnight ? 0 : BASE.finalYeastPct;
  const yeastPct = poolishYeastPct + finalYeastPct;
  const flour = (n * grams) / (1 + BASE.water / BASE.flour + BASE.saltPct + yeastPct);
  const parts = {
    tangzhong: { flour: flour * BASE.tangzhongFlourPct, water: flour * BASE.tangzhongWaterPct },
    poolish: { flour: flour * BASE.poolishFlourPct, water: flour * BASE.poolishWaterPct, yeast: flour * poolishYeastPct },
    final: { flour: flour * BASE.finalFlourPct, water: flour * BASE.finalWaterPct, yeast: flour * finalYeastPct, salt: flour * BASE.saltPct },
  };
  const totalWater = parts.tangzhong.water + parts.poolish.water + parts.final.water;
  const totalYeast = parts.poolish.yeast + parts.final.yeast;
  const totalDough = flour + totalWater + parts.final.salt + totalYeast;
  return {
    mode, profile: overnight ? 'overnight' : 'same-day', count: n, pieceWeight: grams,
    totalDough, flour, water: totalWater, yeast: totalYeast,
    salt: parts.final.salt, hydrationPct: (totalWater / flour) * 100,
    yeastPct: yeastPct * 100, parts,
  };
}

export function formatGrams(n) {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) < 10 && n !== 0) return `${Number(n.toFixed(2)).toLocaleString('en-US', { maximumFractionDigits: 2 })} g`;
  return `${Number(n.toFixed(1)).toLocaleString('en-US', { maximumFractionDigits: 1 })} g`;
}

export function formatNumber(n) {
  return Number(n.toFixed(1)).toLocaleString('en-US', { maximumFractionDigits: 1 });
}

export function getMethod({ mode = 'bread', profile = 'same-day', pizzaStyle = 'round' } = {}) {
  const base = [
    {
      id: 'poolish', phase: 'Preparation', title: 'Activate the poolish', duration: '3–4 hr (variable)', minutes: 210,
      body: 'Combine the poolish flour and instant yeast, then mix in the measured water. Cover and ferment until visibly bubbly, domed, and just starting to recede. Watch the dough, not only the clock.'
    },
    {
      id: 'tangzhong', phase: 'Preparation', title: 'Make the tangzhong', duration: '10 min + cooling', minutes: 10,
      body: 'Pour boiling water into a heatproof bowl. Immediately add the tangzhong flour and stir thoroughly into a thick paste, leaving no dry flour. Cover, cool completely and refrigerate while the poolish ferments.'
    },
    {
      id: 'mix', phase: 'Mixing', title: 'Mix the final dough', duration: '10–15 min', minutes: 12,
      body: 'In a large bowl, combine ice-cold final-dough water and salt. Break up all the cooled tangzhong in this mixture. Stir in the poolish. Add final-dough yeast if listed, then the remaining flour. Mix by hand until uniform; full gluten development is not needed yet.'
    },
    {
      id: 'fold1', phase: 'Cold bulk', title: 'Rest, then fold × 8', duration: '30 min rest', minutes: 30,
      body: 'Cover and refrigerate for 30 minutes. Wet your hands, then stretch one edge of the dough and fold it over itself. Rotate the bowl and repeat eight times. Cover and return to the fridge.'
    },
    {
      id: 'fold2', phase: 'Cold bulk', title: 'Fold × 4 and round', duration: '30 min rest', minutes: 30,
      body: 'After another 30 minutes in the fridge, make four stretch-and-folds. Turn the dough over, gently round it to smooth the surface and cover again.'
    },
    {
      id: 'bulk', phase: 'Cold bulk', title: 'Finish the cold bulk', duration: '60 min', minutes: 60,
      body: 'Refrigerate for one further hour. Total cold bulk after mixing is about two hours. Allow the dough to gain strength; shorten or extend the schedule if fermentation develops unusually fast or slowly.'
    },
  ];

  if (mode === 'bread') {
    return [...base,
      { id: 'shape', phase: 'Shaping', title: 'Shape a batard', duration: '10–15 min', minutes: 12,
        body: 'Lightly flour the surface. Divide first if making multiple loaves. Fold bottom up, sides inward and top down; stitch and roll snugly into an oval. Pinch the ends shut. If tight, allow a 5–10-minute bench rest.' },
      { id: 'proof', phase: 'Final proof', title: 'Proof in the refrigerator', duration: '≈ 60 min', minutes: 60,
        body: 'Transfer seam-up to a rice-flour-dusted banneton. Cover and chill for approximately one hour. Proofing is temperature-sensitive: adjust based on visible expansion and dough feel.' },
      { id: 'preheat', phase: 'Baking', title: 'Preheat and score', duration: 'Preheat thoroughly', minutes: 40,
        body: 'Preheat oven and Dutch oven to 240°C. Tip each cold loaf seam-down onto baking parchment. Score one long shallow-angled slash to encourage an ear.' },
      { id: 'bake1', phase: 'Baking', title: 'Bake covered', duration: '20 min · 230°C', minutes: 20,
        body: 'Place the loaf in the hot Dutch oven and, if safe for your cookware, add a small ice cube beside the dough. Cover and bake at 230°C for 20 minutes (top/bottom heat).' },
      { id: 'bake2', phase: 'Baking', title: 'Finish uncovered', duration: '10–15 min · 200°C', minutes: 13,
        body: 'Remove the lid, reduce to about 200°C and use the fan if available. Bake 10–15 more minutes until deep golden. Cool on a rack before slicing; ideally at least one hour.' },
    ];
  }

  // Pizza is a deliberate adaptation of the bread dough, not quoted from the source method.
  const commonPizza = [
    { id: 'divide', phase: 'Shaping', title: 'Divide and ball', duration: '10 min', minutes: 10,
      body: 'Turn out the dough, divide into the selected number of equal portions and round each into a taut ball. Use a lightly oiled covered container to prevent drying.' },
  ];
  const sameDay = [
    { id: 'relax', phase: 'Final proof', title: 'Let the dough relax', duration: '≈ 1–2 hr', minutes: 90,
      body: 'Allow covered dough balls to relax and become slightly puffy at room temperature before shaping. Start checking early in a hot kitchen; 1% total yeast is an active same-day formula.' },
  ];
  const overnight = [
    { id: 'overnight', phase: 'Cold proof', title: 'Cold-ferment the dough balls', duration: '12–24 hr', minutes: 720,
      body: 'Cover the dough balls and refrigerate at about 3–5°C for 12–24 hours. This variation retains poolish yeast but removes final-dough yeast; monitor the actual expansion, especially in a warm climate.' },
    { id: 'temper', phase: 'Final proof', title: 'Warm until extensible', duration: '≈ 1–2 hr', minutes: 90,
      body: 'Let covered dough balls come toward room temperature until stretchable and lightly puffy. In a warm kitchen, this may take substantially less time.' },
  ];
  const finishRound = [
    { id: 'pizzaheat', phase: 'Baking', title: 'Heat a stone or steel', duration: '45–60 min preheat', minutes: 50,
      body: 'Set the oven to its highest suitable temperature (ideally 260–300°C, or your oven maximum). Preheat the baking stone or steel thoroughly. Higher hydration makes the dough delicate: dust gently and transfer promptly.' },
    { id: 'stretch', phase: 'Baking', title: 'Stretch, top and bake', duration: '≈ 6–10 min', minutes: 8,
      body: 'With floured fingertips, press from the centre outward while preserving a rim; stretch each ball into a round. Add light toppings. Transfer to the very hot surface and bake until the rim is risen and browned and the base is crisp; actual time depends on oven heat.' },
  ];
  const finishPan = [
    { id: 'panheat', phase: 'Baking', title: 'Oil a tray and preheat', duration: '30–45 min preheat', minutes: 40,
      body: 'Generously oil a metal pizza tray. Heat the oven to 240–260°C or its highest suitable setting. This soft, high-hydration dough is especially well suited to a crisp-bottomed pan pizza.' },
    { id: 'press', phase: 'Baking', title: 'Press, top and bake', duration: '≈ 10–16 min', minutes: 13,
      body: 'Ease a relaxed dough ball into the tray, press toward the edges without crushing the rim and rest briefly if it springs back. Add moderate toppings. Bake on a low rack until the underside crisps and the top is well browned.' },
  ];
  return [...base, ...commonPizza, ...(profile === 'overnight' ? overnight : sameDay), ...(pizzaStyle === 'pan' ? finishPan : finishRound)];
}
