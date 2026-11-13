// src/data/events.ts
// Plantation risk telegrams (docs/assets.md §6.1 risk factors) and world telegrams.
import type { CommodityKey } from './commodities';

export interface RiskEvent { title: string; risk: string; yieldMultiplier: number; priceSpike: number; telegram: string }
export interface WorldEvent { id: string; title: string; effect: string; telegram: string }

export const PLANTATION_RISKS: Record<CommodityKey, RiskEvent[]> = {
  tea: [
    { title: 'Ceylon Drought', risk: 'Drought', yieldMultiplier: 0.55, priceSpike: 1.28,
      telegram: 'Severe drought across Ceylon tea estates. Summer yields down 45 per cent. Spot tea surging on the London exchange.' },
    { title: 'Red Spider Mite Outbreak', risk: 'Red spider mite', yieldMultiplier: 0.65, priceSpike: 1.18,
      telegram: 'Red spider mite infestation reported in tea plantations. Hardy seed stock prevents most damage.' },
  ],
  coffee: [
    { title: 'Highland Frost', risk: 'Frost', yieldMultiplier: 0.5, priceSpike: 1.35,
      telegram: 'Black frost strikes the coffee highlands. Cherry harvest halved; Paris and New York roasters bid up reserves.' },
    { title: 'Coffee Rust Fungus', risk: 'Coffee rust fungus', yieldMultiplier: 0.6, priceSpike: 1.22,
      telegram: 'Leaf rust spreading through coffee estates. The Berlin agency recommends hardy seed stock immediately.' },
  ],
  tobacco: [
    { title: 'Summer Hailstorms', risk: 'Hail', yieldMultiplier: 0.52, priceSpike: 1.3,
      telegram: 'Violent hailstorms shred broadleaf tobacco before curing. Warehouse stocks command premium rates.' },
    { title: 'Blue Mold Epidemic', risk: 'Blue mold', yieldMultiplier: 0.62, priceSpike: 1.2,
      telegram: 'Blue mold detected in curing barns. Yields down 38 per cent on unprotected estates.' },
  ],
  cocoa: [
    { title: 'Equatorial Flooding', risk: 'Flooding', yieldMultiplier: 0.48, priceSpike: 1.38,
      telegram: 'Monsoon flooding inundates cocoa groves. Transport delayed and pod yields severely reduced.' },
    { title: 'Black Pod Rot', risk: 'Black pod rot', yieldMultiplier: 0.58, priceSpike: 1.25,
      telegram: 'Black pod rot reported on the Gold Coast. Parisian confectioners scramble for sound beans.' },
  ],
};

export const WORLD_EVENTS: WorldEvent[] = [
  { id: 'ny_boom', title: 'Wall Street Bull Run', effect: 'ny_boom',
    telegram: 'Record dividends on Wall Street. Metropolitan collectors flush with cash this month.' },
  { id: 'forgery_scandal', title: 'Forgery Ring Exposed', effect: 'forgery_vigilance',
    telegram: 'Scotland Yard and the Sûreté warn of clever Old Master forgeries. Consult London or Paris experts before bidding.' },
  { id: 'museum_endowment', title: 'Royal Museum Exhibition Grant', effect: 'museum_bonus',
    telegram: 'National galleries raise exhibition royalties for loaned masterpieces by 25 per cent this month.' },
  { id: 'bumper', title: 'Bumper Shipping Season', effect: 'bumper_harvest',
    telegram: 'Favourable trade winds and ideal rains boost all plantation output by 20 per cent this month.' },
  { id: 'bank_notice', title: 'Bank of England Notice', effect: 'interest_notice',
    telegram: 'The Bank of England advises merchants to keep healthy equity against outstanding syndicate loans.' },
];

