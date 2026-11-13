// src/sim/auction.ts — live bidding state machine with gavel countdown and AI valuations
import { cityById, type City } from '../data/cities';
import { artworkById, isAuthentic, type Artwork } from '../data/artworks';
import { type GameState, type Player, addTelegram, formatDate, random, randomInt, refreshLots, removeFromPool } from './gameState';
import { checkEndConditions } from './economy';

export interface RivalProfile { maxBid: number; paddleUp: boolean; status: string; cooldown: number }

export interface AuctionSession {
  cityId: number;
  city: City;
  art: Artwork;
  localBase: number;
  openingBid: number;
  currentBid: number;
  increment: number;
  highBidderId: number | null;
  highBidderName: string;
  phase: 'bidding' | 'sold' | 'passed';
  gavelStage: 0 | 1 | 2 | 3;
  gavelTimer: number;
  gavelInterval: number;
  rivals: Record<number, RivalProfile>;
  feed: string[];
}

export type SfxHook = (name: 'paddle' | 'gavel' | 'sold') => void;
const G = (n: number) => `${Math.round(n).toLocaleString('en-GB')} G`;

export function createSession(s: GameState, cityId: number): AuctionSession | null {
  const city = cityById(cityId);
  let lot = s.lots[cityId];
  if (!lot && s.artworkPool.length) { refreshLots(s, true); lot = s.lots[cityId]; }
  if (!lot) return null;
  const art = artworkById(lot.artworkId);
  const localBase = Math.floor(art.baseValue * city.exchangeIndex);
  const increment = Math.max(100, Math.floor((localBase * 0.05) / 50) * 50);

  const rivals: Record<number, RivalProfile> = {};
  for (const p of s.players) {
    if (!p.isAI) continue;
    let factor = 0.78 + p.aggression * 0.35 + (random(s) - 0.4) * 0.25;
    if (art.forgery > 0 && randomInt(s, 120, 245) >= art.forgery) {
      factor = random(s) < p.bluffChance ? 0.68 : 0; // suspects a fake
    }
    const maxBid = Math.min(Math.floor(p.cash * 0.82), Math.floor(localBase * factor));
    rivals[p.id] = { maxBid, paddleUp: false, status: maxBid > lot.openingBid ? 'Studying the catalogue' : 'Uninterested', cooldown: 0.4 + random(s) * 0.7 };
  }

  return {
    cityId, city, art, localBase, openingBid: lot.openingBid, currentBid: lot.openingBid, increment,
    highBidderId: null, highBidderName: 'Reserve', phase: 'bidding', gavelStage: 0, gavelTimer: 0, gavelInterval: 2.2,
    rivals,
    feed: [`Lot ${art.id + 1}: “${art.title}”, ${art.artist.name}, ${art.epochYear}. We open at ${G(lot.openingBid)}.`],
  };
}

export const nextBid = (a: AuctionSession, mult = 1): number => (a.highBidderId === null ? a.openingBid : a.currentBid + a.increment * mult);

export function placeBid(s: GameState, a: AuctionSession, p: Player, mult = 1, sfx?: SfxHook): { ok: boolean; msg: string } {
  if (a.phase !== 'bidding') return { ok: false, msg: 'Bidding has closed.' };
  if (a.highBidderId === p.id) return { ok: false, msg: 'You already hold the high bid.' };
  const amount = nextBid(a, mult);
  if (p.cash < amount) return { ok: false, msg: `Insufficient cash — ${G(amount)} required.` };
  a.currentBid = amount;
  a.highBidderId = p.id;
  a.highBidderName = p.name;
  a.gavelStage = 0;
  a.gavelTimer = 0;
  for (const [idStr, prof] of Object.entries(a.rivals)) {
    const id = Number(idStr);
    prof.paddleUp = id === p.id;
    if (id === p.id) prof.status = `Bids ${G(amount)}`;
    else if (prof.maxBid < amount + a.increment) prof.status = 'Shakes head';
    else { prof.status = 'Considering…'; prof.cooldown = 0.55 + random(s) * 0.75; }
  }
  a.feed.unshift(`${p.name} — ${G(amount)}`);
  if (a.feed.length > 8) a.feed.length = 8;
  sfx?.('paddle');
  return { ok: true, msg: `Bid ${G(amount)}` };
}

export function finalize(s: GameState, a: AuctionSession, sfx?: SfxHook): void {
  if (a.phase !== 'bidding') return;
  a.gavelStage = 3;
  if (a.highBidderId !== null) {
    a.phase = 'sold';
    const w = s.players.find((p) => p.id === a.highBidderId)!;
    w.cash -= a.currentBid;
    w.auctionsWon++;
    const auth = isAuthentic(a.art);
    if (!auth) w.forgeriesBought++;
    w.portfolio.push({ id: a.art.id, purchasePrice: a.currentBid, purchaseCityId: a.cityId, purchaseDate: formatDate(s), onMuseumLoan: false });
    removeFromPool(s, a.art.id, w.id);
    const tag = auth ? 'authentic' : `a forgery (Byte 6 $${a.art.forgery.toString(16).toUpperCase()})`;
    a.feed.unshift(`Sold to ${w.name} for ${G(a.currentBid)} — the canvas proves ${tag}.`);
    addTelegram(s, `Auction Result · ${a.city.name}`, `${w.name} acquired “${a.art.title}” for ${G(a.currentBid)}. It proves ${tag}.`, 'auction');
    checkEndConditions(s);
  } else {
    a.phase = 'passed';
    s.lots[a.cityId] = null;
    a.feed.unshift('Lot withdrawn — the reserve was not met.');
  }
  sfx?.('sold');
}

export function passLot(s: GameState, a: AuctionSession, sfx?: SfxHook): void {
  if (a.phase !== 'bidding') return;
  for (let guard = 0; guard < 25; guard++) {
    const amt = nextBid(a);
    const bidder = s.players.find((p) => p.isAI && a.highBidderId !== p.id && (a.rivals[p.id]?.maxBid ?? 0) >= amt && p.cash >= amt);
    if (!bidder) break;
    placeBid(s, a, bidder, 1);
  }
  finalize(s, a, sfx);
}

export function updateAuction(s: GameState, a: AuctionSession, dt: number, sfx?: SfxHook): void {
  if (a.phase !== 'bidding') return;
  const amt = nextBid(a);
  for (const p of s.players) {
    if (!p.isAI || a.highBidderId === p.id) continue;
    const prof = a.rivals[p.id];
    if (!prof) continue;
    prof.cooldown -= dt;
    if (prof.cooldown > 0) continue;
    prof.cooldown = 0.65 + random(s) * 0.85;
    if (prof.maxBid >= amt && p.cash >= amt) {
      placeBid(s, a, p, 1, sfx);
      return;
    }
    prof.status = 'Passes';
    prof.paddleUp = false;
  }
  a.gavelTimer += dt;
  if (a.gavelTimer >= a.gavelInterval) {
    a.gavelTimer -= a.gavelInterval;
    a.gavelStage = (a.gavelStage + 1) as AuctionSession['gavelStage'];
    if (a.gavelStage === 1) { a.feed.unshift(`${G(a.currentBid)} — going once…`); sfx?.('gavel'); }
    else if (a.gavelStage === 2) { a.feed.unshift(`${G(a.currentBid)} — going twice…`); sfx?.('gavel'); }
    else finalize(s, a, sfx);
  }
}

