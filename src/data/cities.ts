// src/data/cities.ts
// Source of truth: docs/assets.md §6.2 (World Travel & Financial Network)

export interface City {
  id: number;
  key: 'london' | 'paris' | 'berlin' | 'new_york';
  name: string;
  country: string;
  subtitle: string;
  travelCost: number;      // assets.md §6.2 "Travel Cost"
  travelDays: number;      // assets.md §6.2 "Travel Duration"
  exchangeIndex: number;   // assets.md §6.2 "Currency Exchange Index"
  currencyName: string;
  hasExpert: boolean;
  expertName: string;
  expertSkill: number;     // compared against Byte 6 forgery quality ($00–$FF)
  expertFee: number;
  bankInterestRate: number;
  maxLoanMultiplier: number;
  auctionFrequency: number;
  hasPlantationAgency: boolean;
  workerHireCost: number;
  seedUpgradeCost: number;
  lon: number;
  lat: number;
  accent: string;
  description: string;
}

export const CITIES: City[] = [
  {
    id: 0, key: 'london', name: 'London', country: 'United Kingdom',
    subtitle: "Christie's & Sotheby's · Bank of England",
    travelCost: 350, travelDays: 1, exchangeIndex: 1.0, currencyName: 'Base Sterling (£)',
    hasExpert: true, expertName: 'Sir Arthur Pendelton, Royal Academy', expertSkill: 0xd2, expertFee: 250,
    bankInterestRate: 0.018, maxLoanMultiplier: 0.65, auctionFrequency: 0.7,
    hasPlantationAgency: false, workerHireCost: 290, seedUpgradeCost: 450,
    lon: -0.13, lat: 51.51, accent: '#c8463f',
    description: "The financial heart of the Empire — Christie's and Sotheby's, the Bank of England's low-interest credit, and Royal Academy appraisers.",
  },
  {
    id: 1, key: 'paris', name: 'Paris', country: 'France',
    subtitle: 'Hôtel Drouot · Salon des Beaux-Arts',
    travelCost: 420, travelDays: 2, exchangeIndex: 0.85, currencyName: 'Franc Index',
    hasExpert: true, expertName: 'Mme. Claire Beaumont, Louvre', expertSkill: 0xe4, expertFee: 320,
    bankInterestRate: 0.022, maxLoanMultiplier: 0.5, auctionFrequency: 0.75,
    hasPlantationAgency: false, workerHireCost: 290, seedUpgradeCost: 450,
    lon: 2.35, lat: 48.86, accent: '#4b7fc4',
    description: 'Continental capital of fine art. The favourable 0.85 exchange index makes Drouot sales and Louvre appraisals prized.',
  },
  {
    id: 2, key: 'berlin', name: 'Berlin', country: 'Germany',
    subtitle: 'Colonial Plantation Agency · Kunstauktion',
    travelCost: 280, travelDays: 1, exchangeIndex: 1.15, currencyName: 'Goldmark Index',
    hasExpert: false, expertName: 'Local Guild Appraiser', expertSkill: 0x88, expertFee: 140,
    bankInterestRate: 0.024, maxLoanMultiplier: 0.55, auctionFrequency: 0.55,
    hasPlantationAgency: true, workerHireCost: 180, seedUpgradeCost: 450,
    lon: 13.4, lat: 52.52, accent: '#c19a3a',
    description: 'Seat of the Plantation Seed & Worker Agency — hire brigades, buy hardy seed stock, and sell harvests at 1.15×.',
  },
  {
    id: 3, key: 'new_york', name: 'New York', country: 'United States',
    subtitle: 'Metropolitan Auctions · Wall Street',
    travelCost: 1800, travelDays: 6, exchangeIndex: 1.4, currencyName: 'Dollar Index',
    hasExpert: false, expertName: 'Fifth Avenue Dealer', expertSkill: 0x96, expertFee: 200,
    bankInterestRate: 0.028, maxLoanMultiplier: 0.9, auctionFrequency: 0.65,
    hasPlantationAgency: false, workerHireCost: 290, seedUpgradeCost: 450,
    lon: -74.0, lat: 40.71, accent: '#3fae86',
    description: 'Six days by steamship. The 1.40× dollar index yields peak returns on colonial harvests and high-limit loans.',
  },
];

export const cityById = (id: number): City => CITIES.find((c) => c.id === id) ?? CITIES[0];

export interface Route { cost: number; days: number; mode: string }

export function getRoute(fromId: number, toId: number): Route {
  if (fromId === toId) return { cost: 0, days: 0, mode: 'Local' };
  const dest = cityById(toId);
  if (fromId === 3) {
    // Return crossing: transatlantic steamship + destination rail leg
    return { cost: 1800 + Math.floor(dest.travelCost * 0.5), days: 6 + (dest.travelDays - 1), mode: 'Transatlantic Steamship' };
  }
  if (toId === 3) return { cost: dest.travelCost, days: dest.travelDays, mode: 'Transatlantic Steamship' };
  return {
    cost: dest.travelCost,
    days: dest.travelDays,
    mode: fromId === 0 || toId === 0 ? 'Channel Packet & Rail' : 'Continental Express',
  };
}

