import './styles/main.css';
import { playSfx, sfx } from './audio/sfx';
import { CITIES, cityById } from './data/cities';
import { MapCanvasRenderer } from './render/mapCanvas';
import { updateAuction } from './sim/auction';
import { advanceDays } from './sim/economy';
import {
  artStats,
  createCampaign,
  formatDate,
  GameState,
  human,
  loadGame,
  netWorth,
  saveGame,
  totalAcres,
} from './sim/gameState';
import { DialogController } from './ui/dialogs';
import {
  DockTab,
  renderHud,
  renderInspector,
  renderQuickBar,
  renderTelegraph,
  showToast,
} from './ui/inspector';

declare global {
  interface Window {
    advanceTime: (ms: number) => void;
    render_game_to_text: () => string;
  }
}

class VermeerWebApp {
  private state: GameState;
  private selectedCityId: number;
  private activeTab: DockTab = 'overview';
  private speed = 1; // 0 = paused, 1 = 1 day / 2.2s, 3 = 1 day / 0.73s
  private dayAccumulator = 0;
  private lastFrameTs = 0;
  private map: MapCanvasRenderer;
  private dialogs: DialogController;

  constructor() {
    sfx.initUnlock();

    const loaded = loadGame();
    this.state = loaded ?? createCampaign();
    this.selectedCityId = human(this.state).cityId;

    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.map = new MapCanvasRenderer(canvas, {
      onSelectCity: (cityId) => {
        this.selectedCityId = cityId;
        playSfx('paper');
        this.refreshAll();
      },
      onDoubleClickCity: (cityId) => {
        this.selectedCityId = cityId;
        const p = human(this.state);
          if (p.cityId === cityId && this.state.lots[cityId]) {
            this.dialogs.openAuction(this.state);
          } else {
            this.activeTab = 'overview';
            this.refreshAll();
          }
        },
      });

    this.dialogs = new DialogController({
      onNewCampaign: (cfg) => {
        this.state = createCampaign(cfg);
        this.selectedCityId = human(this.state).cityId;
        this.activeTab = 'overview';
        this.speed = 1;
        playSfx('paper');
        showToast(`New campaign begun for ${cfg.playerName ?? 'Patron'}.`);
        this.refreshAll();
      },
      onLoadCampaign: () => {
        const saved = loadGame();
        if (saved) {
          this.state = saved;
          this.selectedCityId = human(this.state).cityId;
          playSfx('paper');
          showToast('Saved campaign restored.');
          this.refreshAll();
        } else {
          showToast('No saved campaign found.', true);
        }
      },
      onStateChanged: () => {
        this.refreshAll();
      },
    });

    this.bindUiControls();
    this.installTestHooks();
    this.refreshAll();

    this.lastFrameTs = performance.now();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  private bindUiControls(): void {
    document.querySelectorAll<HTMLButtonElement>('.dock-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab as DockTab | undefined;
        if (tab) {
          this.activeTab = tab;
          playSfx('paper');
          this.refreshInspectorAndBar();
        }
      });
    });

    document.getElementById('btn-speed-pause')?.addEventListener('click', () => {
      this.speed = 0;
      this.refreshHudOnly();
    });
    document.getElementById('btn-speed-play')?.addEventListener('click', () => {
      this.speed = 1;
      this.refreshHudOnly();
    });
    document.getElementById('btn-speed-fast')?.addEventListener('click', () => {
      this.speed = 3;
      this.refreshHudOnly();
    });
    document.getElementById('btn-step-5d')?.addEventListener('click', () => {
      this.stepSimulationDays(5);
    });

    document.getElementById('btn-save-game')?.addEventListener('click', () => {
      saveGame(this.state);
      playSfx('paper');
      showToast('Campaign saved to browser storage.');
    });

    document.getElementById('btn-open-rules')?.addEventListener('click', () => {
      this.dialogs.openRules();
    });

    document.getElementById('btn-open-setup')?.addEventListener('click', () => {
      this.dialogs.openSetup(this.state);
    });

    document.getElementById('btn-open-auction')?.addEventListener('click', () => {
      this.dialogs.openAuction(this.state);
    });

    window.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
        const idx = Number(e.key) - 1;
        if (CITIES[idx]) {
          this.selectedCityId = CITIES[idx].id;
          this.refreshAll();
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        this.speed = this.speed === 0 ? 1 : 0;
        this.refreshHudOnly();
      } else if (e.key === 'h' || e.key === 'H') {
        this.dialogs.openRules();
      } else if (e.key === 'b' || e.key === 'B') {
        this.activeTab = 'overview';
        this.refreshInspectorAndBar();
      } else if (e.key === 'e' || e.key === 'E') {
        this.activeTab = 'estates';
        this.refreshInspectorAndBar();
      } else if (e.key === 'm' || e.key === 'M') {
        this.activeTab = 'market';
        this.refreshInspectorAndBar();
      } else if (e.key === 'p' || e.key === 'P') {
        this.activeTab = 'gallery';
        this.refreshInspectorAndBar();
      } else if (e.key === 'F5') {
        e.preventDefault();
        saveGame(this.state);
        showToast('Quick-saved campaign.');
      } else if (e.key === 'F9') {
        e.preventDefault();
        const saved = loadGame();
        if (saved) {
          this.state = saved;
          this.selectedCityId = human(this.state).cityId;
          this.refreshAll();
          showToast('Quick-loaded campaign.');
        }
      }
    });
  }

  private stepSimulationDays(days: number): void {
    if (this.state.gameOver) return;
    const prevNewsLen = this.state.telegrams.length;
    advanceDays(this.state, days);
      if (this.state.telegrams.length > prevNewsLen) {
        playSfx('telegraph');
      }
      if (this.state.gameOver) {
        this.speed = 0;
        this.dialogs.openSetup(this.state);
      }
      this.refreshAll();
    }

  private advanceBySeconds(dt: number): void {
    const auction = this.dialogs.getAuctionSession();
        if (auction && auction.phase === 'bidding') {
          const prevBid = auction.currentBid;
          const prevStage = auction.gavelStage;
          const prevPhase = auction.phase;
          updateAuction(this.state, auction, dt, playSfx);
          if (auction.currentBid !== prevBid || auction.gavelStage !== prevStage || auction.phase !== prevPhase) {
            this.dialogs.renderAuction(this.state);
            this.refreshHudOnly();
            if (this.state.gameOver) {
              this.dialogs.closeAuction();
              this.dialogs.openSetup(this.state);
            }
          }
          return;
        }

        if (this.speed > 0 && !this.state.gameOver && !this.dialogs.isAnyModalOpen()) {
          const secondsPerDay = 2.2 / this.speed;
          this.dayAccumulator += dt;
          if (this.dayAccumulator >= secondsPerDay) {
            const steps = Math.floor(this.dayAccumulator / secondsPerDay);
            this.dayAccumulator -= steps * secondsPerDay;
            this.stepSimulationDays(Math.min(5, steps));
          }
        }
      }

  private loop(ts: number): void {
    const dt = Math.min(0.1, Math.max(0, (ts - this.lastFrameTs) / 1000));
    this.lastFrameTs = ts;

    this.advanceBySeconds(dt);
    this.map.render(this.state, this.selectedCityId, dt);
    requestAnimationFrame((nextTs) => this.loop(nextTs));
  }

  private refreshHudOnly(): void {
    renderHud(this.state, this.speed);
  }

  private refreshInspectorAndBar(): void {
    const callbacks = {
      onSelectCity: (cityId: number) => {
        this.selectedCityId = cityId;
        this.refreshAll();
      },
      onOpenAuction: () => this.dialogs.openAuction(this.state),
      onStateChanged: () => this.refreshAll(),
    };
    renderInspector(this.state, this.selectedCityId, this.activeTab, callbacks);
    renderQuickBar(this.state, this.selectedCityId, callbacks);
  }

  private refreshAll(): void {
    this.refreshHudOnly();
    this.refreshInspectorAndBar();
    renderTelegraph(this.state);
    this.map.redrawLast(0);
  }

  private installTestHooks(): void {
    window.advanceTime = (ms: number) => {
      const step = 0.05;
      let remaining = Math.max(0, ms / 1000);
      while (remaining > 0) {
        const slice = Math.min(step, remaining);
        this.advanceBySeconds(slice);
        remaining -= slice;
      }
      this.map.render(this.state, this.selectedCityId, 0);
      this.refreshAll();
    };

    window.render_game_to_text = () => {
      const p = human(this.state);
      const stats = artStats(p);
      const auction = this.dialogs.getAuctionSession();
      const openCities = CITIES.filter((c) => Boolean(this.state.lots[c.id])).map((c) => c.name);
      return JSON.stringify({
        date: formatDate(this.state),
        turn: this.state.turn,
        speed: this.speed,
        gameOver: this.state.gameOver,
        victory: this.state.winnerId === p.id,
        selectedCity: cityById(this.selectedCityId).name,
        activeTab: this.activeTab,
        player: {
          name: p.name,
          city: cityById(p.cityId).name,
          cash: Math.round(p.cash),
          loan: Math.round(p.loan),
          netWorth: Math.round(netWorth(this.state, p)),
          totalAcres: totalAcres(p),
          artworks: p.portfolio.length,
          authenticArtworks: stats.authentic,
          targetArtworks: this.state.targetArtworks,
        },
        openAuctionCities: openCities,
        activeAuction: auction
          ? {
            city: cityById(auction.cityId).name,
            artworkTitle: auction.art.title,
            currentBid: auction.currentBid,
            phase: auction.phase,
          }
          : null,
      });
    };
  }
}

new VermeerWebApp();
