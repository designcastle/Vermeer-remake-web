import { paintingSrc } from '../data/artworks';
import { cityById } from '../data/cities';
import { RULEBOOK } from '../data/tutorials';
import {
  AuctionSession,
  createSession,
  nextBid,
  passLot,
  placeBid,
} from '../sim/auction';
import { finalScore } from '../sim/economy';
import {
  artStats,
  CampaignConfig,
  GameState,
  hasSave,
  human,
  netWorth,
} from '../sim/gameState';
import { fmtMoney, showToast } from './inspector';
import { playSfx } from '../audio/sfx';

export interface DialogCallbacks {
  onNewCampaign: (cfg: CampaignConfig) => void;
  onLoadCampaign: () => void;
  onStateChanged: () => void;
}

export class DialogController {
  private auctionDialog: HTMLDialogElement;
  private rulesDialog: HTMLDialogElement;
  private setupDialog: HTMLDialogElement;
  private activeAuction: AuctionSession | null = null;
  private callbacks: DialogCallbacks;

  constructor(callbacks: DialogCallbacks) {
    this.callbacks = callbacks;
    this.auctionDialog = document.getElementById('auction-dialog') as HTMLDialogElement;
    this.rulesDialog = document.getElementById('rules-dialog') as HTMLDialogElement;
    this.setupDialog = document.getElementById('setup-dialog') as HTMLDialogElement;

    this.installLightDismissFallback(this.auctionDialog);
    this.installLightDismissFallback(this.rulesDialog);
    this.installLightDismissFallback(this.setupDialog);

    document.getElementById('btn-close-auction')?.addEventListener('click', () => {
      this.closeAuction();
    });

    document.querySelectorAll<HTMLButtonElement>('[data-close-dialog]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.closeDialog;
        if (id) {
          const dlg = document.getElementById(id) as HTMLDialogElement | null;
          dlg?.close();
        }
      });
    });

    const searchInput = document.getElementById('rules-search-input') as HTMLInputElement | null;
    searchInput?.addEventListener('input', () => {
      this.renderRules(searchInput.value);
    });
  }

  private installLightDismissFallback(dialog: HTMLDialogElement): void {
    // Baseline fallback for Safari/browsers without HTMLDialogElement.prototype.closedBy
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          dialog.close();
        }
      });
    }
  }

  public getAuctionSession(): AuctionSession | null {
    return this.activeAuction;
  }

  public isAnyModalOpen(): boolean {
    return this.auctionDialog.open || this.rulesDialog.open || this.setupDialog.open;
  }

  public openAuction(state: GameState): void {
    const p = human(state);
    const session = createSession(state, p.cityId);
    if (!session) {
      showToast('No active auction lot in this city right now.', true);
      return;
    }
    this.activeAuction = session;
    playSfx('gavel');
    this.renderAuction(state);
    if (!this.auctionDialog.open) {
      this.auctionDialog.showModal();
    }
  }

  public closeAuction(): void {
    this.activeAuction = null;
    if (this.auctionDialog.open) {
      this.auctionDialog.close();
    }
  }

  public renderAuction(state: GameState): void {
    const a = this.activeAuction;
    if (!a) return;

    const city = cityById(a.cityId);
    const sub = document.getElementById('auction-house-subtitle');
    if (sub) sub.textContent = `${city.name} Salon · Lot #${a.art.id + 1}`;
    const titleEl = document.getElementById('auction-modal-title');
    if (titleEl) titleEl.textContent = `Lot #${a.art.id + 1} — ${a.art.title}`;

    const body = document.getElementById('auction-dialog-body');
    if (!body) return;

      if (a.phase !== 'bidding') {
        const outcomeTitle = a.phase === 'sold' ? 'Hammer Down — Sold!' : 'Lot Passed';
        const outcomeMsg = a.feed[0] ?? 'The auction has concluded.';
        body.innerHTML = `
        <div class="auction-finished">
          <h3>${outcomeTitle}</h3>
          <p class="muted">${escapeHtml(outcomeMsg)}</p>
          <button id="btn-auction-done" class="gold-btn">Return to Cartographic Map</button>
        </div>`;
        document.getElementById('btn-auction-done')?.addEventListener('click', () => {
          this.closeAuction();
          this.callbacks.onStateChanged();
        });
        return;
      }

      const art = a.art;
      const p = human(state);
      const stdBid = nextBid(a, 1);
      const boldBid = nextBid(a, 2);
      const totalGavelWindow = a.gavelInterval * 3;
      const elapsed = a.gavelStage * a.gavelInterval + a.gavelTimer;
      const pct = Math.max(0, Math.min(100, (1 - elapsed / totalGavelWindow) * 100));

      body.innerHTML = `
      <div class="auction-layout">
        <div class="auction-canvas-frame">
          <img class="auction-painting" src="${paintingSrc(art.id)}" alt="${escapeHtml(art.title)}" />
          <img class="auction-ornate-overlay" src="./assets/ui/ornate_frame.png" alt="" />
        </div>
        <div class="auction-details">
          <div class="auction-art-head">
            <h3>${escapeHtml(art.title)}</h3>
            <p class="muted">${escapeHtml(art.artist.name)} · ${art.epochYear} · ${escapeHtml(art.artist.school)}</p>
          </div>

          <div class="stat-grid">
            <div class="stat-box"><span>Local Estimate</span><strong>${fmtMoney(a.localBase)}</strong></div>
            <div class="stat-box"><span>Current Bid</span><strong class="gold">${fmtMoney(a.currentBid)}</strong></div>
            <div class="stat-box"><span>Highest Bidder</span><strong>${escapeHtml(a.highBidderName)}</strong></div>
            <div class="stat-box"><span>Your Cash</span><strong>${fmtMoney(p.cash)}</strong></div>
          </div>

          <div class="timer-track" aria-label="Gavel countdown">
            <div class="timer-fill" style="width:${pct.toFixed(1)}%"></div>
          </div>
          <div class="auction-status-line">${escapeHtml(a.feed[0] ?? 'Opening the bidding…')}</div>

          <div class="btn-row">
            <button id="btn-bid-std" class="gold-btn" ${p.cash < stdBid || a.highBidderId === p.id ? 'disabled' : ''}>
              Raise Paddle (${fmtMoney(stdBid)})
            </button>
            <button id="btn-bid-bold" class="panel-btn" ${p.cash < boldBid || a.highBidderId === p.id ? 'disabled' : ''}>
              Jump Bid (${fmtMoney(boldBid)})
            </button>
            <button id="btn-pass-lot" class="panel-btn">
              Pass Lot
            </button>
          </div>
        </div>
      </div>`;

      document.getElementById('btn-bid-std')?.addEventListener('click', () => {
        if (!this.activeAuction) return;
        const res = placeBid(state, this.activeAuction, p, 1, playSfx);
        if (!res.ok) showToast(res.msg, true);
        this.renderAuction(state);
        this.callbacks.onStateChanged();
      });

      document.getElementById('btn-bid-bold')?.addEventListener('click', () => {
        if (!this.activeAuction) return;
        const res = placeBid(state, this.activeAuction, p, 2, playSfx);
        if (!res.ok) showToast(res.msg, true);
        this.renderAuction(state);
        this.callbacks.onStateChanged();
      });

      document.getElementById('btn-pass-lot')?.addEventListener('click', () => {
        if (!this.activeAuction) return;
        passLot(state, this.activeAuction, playSfx);
        this.renderAuction(state);
        this.callbacks.onStateChanged();
      });
    }

  public openRules(): void {
    const searchInput = document.getElementById('rules-search-input') as HTMLInputElement | null;
    if (searchInput) searchInput.value = '';
    this.renderRules('');
    if (!this.rulesDialog.open) {
      this.rulesDialog.showModal();
    }
  }

  private renderRules(query: string): void {
    const container = document.getElementById('rules-articles-container');
    if (!container) return;
    const q = query.trim().toLowerCase();
    const filtered = RULEBOOK.filter(
      (r) =>
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.keywords.toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q),
    );

    if (filtered.length === 0) {
      container.innerHTML = `<p class="muted">No encyclopedia entries match "${escapeHtml(query)}".</p>`;
      return;
    }

    container.innerHTML = filtered
      .map(
        (r) => `
        <article class="rule-card">
          <h3>${escapeHtml(r.title)}</h3>
          <p>${escapeHtml(r.body)}</p>
        </article>`,
      )
      .join('');
  }

  public openSetup(state?: GameState): void {
    const body = document.getElementById('setup-dialog-body');
    if (!body) return;

    if (state?.gameOver) {
      const p = human(state);
      const stats = artStats(p);
      const score = finalScore(state, p);
      const won = state.winnerId === p.id;
      body.innerHTML = `
        <div class="setup-panel">
          <div class="notice-banner ${won ? 'success' : 'danger'}">
            <strong>${won ? 'Grand Patron Victory!' : 'Campaign Ended'}</strong><br/>
            ${escapeHtml(state.endReason ?? '')}
          </div>
          <div class="stat-grid">
            <div class="stat-box"><span>Final Net Worth</span><strong>${fmtMoney(netWorth(state, p))}</strong></div>
            <div class="stat-box"><span>Authentic Masters</span><strong>${stats.authentic} / ${state.targetArtworks}</strong></div>
            <div class="stat-box"><span>Forgeries Held</span><strong class="danger">${stats.forgeries}</strong></div>
            <div class="stat-box"><span>Final Score</span><strong class="gold">${score.toLocaleString('en-US')}</strong></div>
          </div>
          <div class="btn-row">
            <button id="btn-start-fresh" class="gold-btn">Begin New Campaign</button>
          </div>
        </div>`;

      document.getElementById('btn-start-fresh')?.addEventListener('click', () => {
        this.renderNewCampaignForm(body);
      });
    } else {
      this.renderNewCampaignForm(body);
    }

    if (!this.setupDialog.open) {
      this.setupDialog.showModal();
    }
  }

  private renderNewCampaignForm(body: HTMLElement): void {
    const saveAvailable = hasSave();
    body.innerHTML = `
      <form id="campaign-setup-form" class="setup-panel">
        <p class="muted">
          Acquire authentic Old Master paintings through transatlantic commodity trade and live salon auctions before the final reckoning.
        </p>
        <label class="field-label">
          <span>Collector Name</span>
          <input id="cfg-name" type="text" value="Patron" maxlength="24" required />
        </label>
        <div class="form-two-col">
          <label class="field-label">
            <span>Campaign Horizon</span>
            <select id="cfg-years">
              <option value="8">8 Years (Sprint)</option>
              <option value="12" selected>12 Years (Standard)</option>
              <option value="16">16 Years (Grand Tour)</option>
            </select>
          </label>
          <label class="field-label">
            <span>Victory Goal</span>
            <select id="cfg-target">
              <option value="5">5 Authentic Paintings</option>
              <option value="6" selected>6 Authentic Paintings</option>
              <option value="8">8 Authentic Paintings</option>
            </select>
          </label>
        </div>
        <div class="btn-row">
          <button type="submit" class="gold-btn">Launch Campaign</button>
          ${saveAvailable ? '<button type="button" id="btn-resume-save" class="panel-btn">Resume Saved Campaign</button>' : ''}
        </div>
      </form>`;

    document.getElementById('campaign-setup-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameEl = document.getElementById('cfg-name') as HTMLInputElement;
      const yearsEl = document.getElementById('cfg-years') as HTMLSelectElement;
      const targetEl = document.getElementById('cfg-target') as HTMLSelectElement;
      this.setupDialog.close();
      this.callbacks.onNewCampaign({
        playerName: nameEl.value.trim() || 'Patron',
        maxYears: Number(yearsEl.value) || 12,
        targetArtworks: Number(targetEl.value) || 6,
      });
    });

    document.getElementById('btn-resume-save')?.addEventListener('click', () => {
      this.setupDialog.close();
      this.callbacks.onLoadCampaign();
    });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
