// src/data/tutorials.ts — searchable encyclopedia entries

export interface RuleArticle { title: string; keywords: string; body: string }

export const RULEBOOK: RuleArticle[] = [
  {
    title: "Uncle Walter's Testament",
    keywords: 'win victory goal masterpieces net worth bankruptcy rivals',
    body: 'Recover the target number of AUTHENTIC Old Masters and reach the net-worth goal before December of the final year. Rivals Gerd, Kurt and Baron von Stahl race you for the same canvases. Fall below −12,000 G net worth with negative cash and the bank forecloses.',
  },
  {
    title: 'Travel & Exchange Indices',
    keywords: 'travel city london paris berlin new york currency exchange steamship',
    body: 'London 350 G · 1 day · 1.00×. Paris 420 G · 2 days · 0.85×. Berlin 280 G · 1 day · 1.15×. New York 1,800 G · 6 days · 1.40×. Buy where the index is low, sell harvests where it is high.',
  },
  {
    title: 'Colonial Plantations',
    keywords: 'plantation estate tea coffee tobacco cocoa harvest yield workers seeds berlin',
    body: 'Each acre yields its base cwt in its harvest months and 35% otherwise. One worker brigade per acre gives full output. Berlin sells brigades at 180 G and Hardy Seed Stock that cuts weather and pest losses by 70%.',
  },
  {
    title: 'Auctions & Forgeries (Byte 6)',
    keywords: 'auction art painting forgery expert appraisal byte museum loan',
    body: 'Each catalog record carries a forgery byte: $00 is an original, $01–$FF a forgery of that quality. An expert catches a fake when their skill ≥ the byte. Paris (228) and London (210) have the sharpest eyes. Forgeries are worth nothing at the final reckoning.',
  },
  {
    title: 'Banking & Museum Loans',
    keywords: 'bank loan interest credit museum royalties',
    body: 'Borrow against net worth — up to 90% in New York, cheapest at 1.8%/month in London. Interest compounds monthly. Lend authentic paintings to museums for 3.5% of value per month while keeping ownership.',
  },
  {
    title: 'Controls',
    keywords: 'keyboard shortcuts controls save load',
    body: 'Space: +5 days (bid in the salon). 1–4: inspector tabs. A: auction salon. B/E/P: jump bid, appraise, pass. H: encyclopedia. F5/F9: save/load. Drag to pan the map, scroll to zoom.',
  },
];

