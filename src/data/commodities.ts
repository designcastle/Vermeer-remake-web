// src/data/commodities.ts
// Source of truth: docs/assets.md §6.1 (Plantation Commodity Master Tables)

export type CommodityKey = 'tea' | 'coffee' | 'tobacco' | 'cocoa';

export interface Commodity {
  id: number;
  key: CommodityKey;
  name: string;
  germanId: string;
  plantationBaseCost: number;
  baseYieldCwt: number;
  optimalMonths: number[];
  optimalLabel: string;
  riskFactors: string[];
  baseMarketPrice: number;
  minPrice: number;
  maxPrice: number;
  volatility: number;
  upkeepPerAcre: number;
  region: string;
  color: string;
  glyph: string;
}

export const COMMODITIES: Commodity[] = [
  {
    id: 1, key: 'tea', name: 'Tea', germanId: 'TEE', plantationBaseCost: 1200, baseYieldCwt: 80,
    optimalMonths: [6, 7, 8], optimalLabel: 'June–August', riskFactors: ['Drought', 'Red spider mite'],
    baseMarketPrice: 18, minPrice: 9, maxPrice: 34, volatility: 0.14, upkeepPerAcre: 95,
    region: 'Ceylon & Darjeeling', color: '#6fbf7a', glyph: '🍃',
  },
  {
    id: 2, key: 'coffee', name: 'Coffee', germanId: 'KAFFEE', plantationBaseCost: 2400, baseYieldCwt: 65,
    optimalMonths: [9, 10, 11], optimalLabel: 'September–November', riskFactors: ['Frost', 'Coffee rust fungus'],
    baseMarketPrice: 36, minPrice: 18, maxPrice: 68, volatility: 0.18, upkeepPerAcre: 160,
    region: 'Santos & Highland Java', color: '#b9824f', glyph: '☕',
  },
  {
    id: 3, key: 'tobacco', name: 'Tobacco', germanId: 'TABAK', plantationBaseCost: 1800, baseYieldCwt: 110,
    optimalMonths: [7, 8, 9], optimalLabel: 'July–September', riskFactors: ['Hail', 'Blue mold'],
    baseMarketPrice: 21, minPrice: 10, maxPrice: 42, volatility: 0.16, upkeepPerAcre: 135,
    region: 'Virginia & Havana', color: '#d9a441', glyph: '🌿',
  },
  {
    id: 4, key: 'cocoa', name: 'Cocoa', germanId: 'KAKAO', plantationBaseCost: 3100, baseYieldCwt: 50,
    optimalMonths: [10, 11, 12], optimalLabel: 'October–December', riskFactors: ['Flooding', 'Black pod rot'],
    baseMarketPrice: 58, minPrice: 28, maxPrice: 110, volatility: 0.22, upkeepPerAcre: 210,
    region: 'Gold Coast & Bahia', color: '#c4687f', glyph: '🫘',
  },
];

export const commodityByKey = (k: CommodityKey): Commodity => COMMODITIES.find((c) => c.key === k)!;
export const isOptimalMonth = (c: Commodity, month: number): boolean => c.optimalMonths.includes(month);

