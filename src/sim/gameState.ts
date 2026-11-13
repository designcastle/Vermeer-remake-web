// src/sim/gameState.ts — serialisable campaign state, deterministic RNG, valuation helpers
import { CITIES, cityById } from '../data/cities';
import { COMMODITIES, type CommodityKey } from '../data/commodities';
import { ARTWORKS, artworkById, isAuthentic } from '../data/artworks';

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export interface OwnedArt {
  id: number;
  purchasePrice: number;
  purchaseCityId: number;
  purchaseDate: string;
  onMuseumLoan: boolean;
}

export interface Appraisal { appearsAuthentic: boolean; confidence: number; expert: string; note: string }

export interface Player {
  id: number;
  name: string;
  title: string;
  isAI: boolean;
  cityId: number;
  cash: number;
  loan: number;
  loanCityId: number;
  estates: Record<CommodityKey, number>;
  inventory: Record<CommodityKey, number>;
  workers: number;
  hardySeeds: boolean;
  portfolio: OwnedArt[];
  appraised: Record<number, Appraisal>;
  aggression: number;
  bluffChance: number;
  preferred: CommodityKey;
  portrait: string;
  color: string;
  totalCropSales: number;
  auctionsWon: number;
  forgeriesBought: number;
}

export interface Lot { cityId: number; artworkId: number; openingBid: number; createdTurn: number }
export interface Telegram { date: string; title: string; body: string; kind: 'risk' | 'world' | 'ledger' | 'auction' | 'rival' | 'system' }

export interface GameState {
  version: 3;
  seed: number;
  rng: number;
  year: number;
  startYear: number;
  maxYears: number;
  month: number;
  day: number;
  turn: number;
  targetArtworks: number;
  targetNetWorth: number;
  players: Player[];
  prices: Record<CommodityKey, number>;
  priceHistory: Record<CommodityKey, number[]>;
  artworkPool: number[];
  owners: Record<number, number>;
  lots: Record<number, Lot | null>;
  modifier: string | null;
  telegrams: Telegram[];
  gameOver: boolean;
  winnerId: number | null;
  endReason: string | null;
}

export interface CampaignConfig {
  totalPlayers?: number;
  targetArtworks?: number;
  maxYears?: number;
  targetNetWorth?: number;
  playerName?: string;
  seed?: number;
}

const RIVALS = [
  { name: 'Gerd', title: 'Hamburg Merchant', aggression: 0.58, bluffChance: 0.18, preferred: 'coffee' as CommodityKey, portrait: './assets/paintings/art_31.jpg', color: '#5b8fd6' },
  { name: 'Kurt', title: 'Rhenish Industrialist', aggression: 0.72, bluffChance: 0.25, preferred: 'tobacco' as CommodityKey, portrait: './assets/paintings/art_40.jpg', color: '#d99a3e' },
  { name: 'Baron von Stahl', title: 'Prussian Connoisseur', aggression: 0.84, bluffChance: 0.32, preferred: 'cocoa' as CommodityKey, portrait: './assets/paintings/art_15.jpg', color: '#c9545a' },
];

const emptyBook = (): Record<CommodityKey, number> => ({ tea: 0, coffee: 0, tobacco: 0, cocoa: 0 });

// ---------------------------------------------------------------- RNG (Park–Miller, exact integer math)
export function random(s: GameState): number {
  s.rng = (s.rng * 48271) % 2147483647;
  return s.rng / 2147483647;
}
export function randomInt(s: GameState, min: number, max: number): number {
  if (max <= min) return min;
  return min + Math.floor(random(s) * (max - min + 1));
}

// ---------------------------------------------------------------- creation
export function createCampaign(cfg: CampaignConfig = {}): GameState {
  const seed = cfg.seed ?? (Date.now() % 2147483646) + 1;
  const s: GameState = {
    version: 3, seed, rng: seed % 2147483647 || 19870604,
    year: 1924, startYear: 1924, maxYears: cfg.maxYears ?? 3, month: 5, day: 1, turn: 1,
    targetArtworks: cfg.targetArtworks ?? 5, targetNetWorth: cfg.targetNetWorth ?? 55000,
    players: [], prices: emptyBook(), priceHistory: { tea: [], coffee: [], tobacco: [], cocoa: [] },
    artworkPool: [], owners: {}, lots: {}, modifier: null, telegrams: [],
    gameOver: false, winnerId: null, endReason: null,
  };

  const total = Math.min(4, Math.max(2, cfg.totalPlayers ?? 4));
  for (let i = 1; i <= total; i++) {
    const isAI = i > 1;
    const tpl = isAI ? RIVALS[i - 2] : null;
    const estates = emptyBook();
    const inventory = emptyBook();
    estates.tea = 1;
    inventory.tea = 40;
    s.players.push({
      id: i,
      name: tpl ? tpl.name : cfg.playerName ?? 'Lady Vermeer',
      title: tpl ? tpl.title : 'House of Vermeer',
      isAI, cityId: isAI ? (i - 1) % 4 : 0, cash: 18000, loan: 0, loanCityId: 0,
      estates, inventory, workers: 2, hardySeeds: false, portfolio: [], appraised: {},
      aggression: tpl?.aggression ?? 0.6, bluffChance: tpl?.bluffChance ?? 0.2, preferred: tpl?.preferred ?? 'tea',
      portrait: tpl?.portrait ?? './assets/portraits/player.jpg', color: tpl?.color ?? '#f7dc84',
      totalCropSales: 0, auctionsWon: 0, forgeriesBought: 0,
    });
  }

  for (const c of COMMODITIES) {
    const hist: number[] = [];
    for (let step = 1; step <= 14; step++) {
      hist.push(Math.round(c.baseMarketPrice + Math.sin(step * 0.65 + c.id * 1.3) * c.baseMarketPrice * 0.12));
    }
    s.priceHistory[c.key] = hist;
    s.prices[c.key] = hist[hist.length - 1];
  }

  for (const a of ARTWORKS) {
    s.artworkPool.push(a.id);
    s.owners[a.id] = 0;
  }
  for (let i = s.artworkPool.length - 1; i > 0; i--) {
    const j = randomInt(s, 0, i);
    [s.artworkPool[i], s.artworkPool[j]] = [s.artworkPool[j], s.artworkPool[i]];
  }

  refreshLots(s, true);
  addTelegram(s, "Uncle Walter's Testament",
    `Solicitors confirm the will. Recover ${s.targetArtworks} authentic Old Masters and build ${s.targetNetWorth.toLocaleString('en-GB')} G of net worth before December ${s.startYear + s.maxYears - 1}.`, 'system');
  return s;
}

// ---------------------------------------------------------------- helpers
export const human = (s: GameState): Player => s.players[0];
export const formatDate = (s: GameState): string => `${s.day} ${MONTHS[s.month - 1]} ${s.year}`;

export function addTelegram(s: GameState, title: string, body: string, kind: Telegram['kind']): void {
  s.telegrams.unshift({ date: formatDate(s), title, body, kind });
  if (s.telegrams.length > 30) s.telegrams.length = 30;
}

export const totalAcres = (p: Player): number => COMMODITIES.reduce((n, c) => n + p.estates[c.key], 0);

export const estateValue = (p: Player): number =>
  COMMODITIES.reduce((n, c) => n + p.estates[c.key] * c.plantationBaseCost, 0);

export const inventoryValue = (s: GameState, p: Player): number =>
  COMMODITIES.reduce((n, c) => n + Math.floor(p.inventory[c.key] * s.prices[c.key]), 0);

export function artStats(p: Player): { value: number; authentic: number; forgeries: number; loaned: number } {
  let value = 0, authentic = 0, forgeries = 0, loaned = 0;
  for (const o of p.portfolio) {
    const a = artworkById(o.id);
    if (isAuthentic(a)) {
      value += a.baseValue;
      authentic++;
      if (o.onMuseumLoan) loaned++;
    } else forgeries++;
  }
  return { value, authentic, forgeries, loaned };
}

export const netWorth = (s: GameState, p: Player): number =>
  Math.floor(p.cash - p.loan + estateValue(p) + inventoryValue(s, p) + artStats(p).value);

export function maxCredit(s: GameState, p: Player, cityId = p.cityId): number {
  return Math.floor(Math.max(5000, netWorth(s, p)) * cityById(cityId).maxLoanMultiplier);
}

export function refreshLots(s: GameState, force: boolean): void {
  for (const city of CITIES) {
    if (s.artworkPool.length === 0) return;
    const cur = s.lots[city.id];
    if (!(force || !cur || random(s) < city.auctionFrequency)) continue;
    const artId = s.artworkPool[randomInt(s, 0, s.artworkPool.length - 1)];
    const art = artworkById(artId);
    const opening = Math.floor((art.baseValue * (0.55 + random(s) * 0.15) * city.exchangeIndex) / 50) * 50;
    s.lots[city.id] = { cityId: city.id, artworkId: artId, openingBid: Math.max(500, opening), createdTurn: s.turn };
  }
}

export function removeFromPool(s: GameState, artworkId: number, ownerId: number): void {
  s.owners[artworkId] = ownerId;
  s.artworkPool = s.artworkPool.filter((id) => id !== artworkId);
  for (const c of CITIES) if (s.lots[c.id]?.artworkId === artworkId) s.lots[c.id] = null;
}

// ---------------------------------------------------------------- persistence (localStorage)
const SAVE_KEY = 'vermeer-web-save-v3';
export const saveGame = (s: GameState): void => localStorage.setItem(SAVE_KEY, JSON.stringify(s));
export const hasSave = (): boolean => localStorage.getItem(SAVE_KEY) !== null;
export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as GameState;
    return s.version === 3 ? s : null;
  } catch {
    return null;
  }
}

