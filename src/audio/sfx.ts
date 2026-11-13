export type SfxName = 'coin' | 'paddle' | 'gavel' | 'sold' | 'telegraph' | 'paper';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private initialized = false;

  public initUnlock(): void {
    if (this.initialized) return;
    this.initialized = true;

    const unlock = (): void => {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended' && !this.muted) {
        void this.ctx.resume();
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) {
        if (this.ctx.state === 'running') {
          void this.ctx.suspend();
        }
      } else if (!this.muted && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
    });
  }

  public setMuted(m: boolean): void {
    this.muted = m;
    if (!this.ctx) return;
    if (m && this.ctx.state === 'running') {
      void this.ctx.suspend();
    } else if (!m && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public play(name: SfxName): void {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    switch (name) {
      case 'coin':
        this.tone(1318.5, 1760, 0.08, 'sine', 0.08, now);
        this.tone(1760, 2093, 0.14, 'triangle', 0.06, now + 0.05);
        break;
      case 'paddle':
        this.tone(420, 620, 0.06, 'triangle', 0.07, now);
        break;
      case 'gavel':
        this.tone(140, 68, 0.09, 'sine', 0.16, now);
        this.noise(0.05, 900, 0.08, now);
        break;
      case 'sold':
        this.tone(523.25, 523.25, 0.12, 'triangle', 0.08, now);
        this.tone(659.25, 659.25, 0.12, 'triangle', 0.08, now + 0.08);
        this.tone(783.99, 783.99, 0.25, 'triangle', 0.09, now + 0.16);
        break;
      case 'telegraph':
        this.tone(1040, 1040, 0.028, 'square', 0.03, now);
        this.tone(1040, 1040, 0.028, 'square', 0.03, now + 0.055);
        break;
      case 'paper':
        this.noise(0.08, 2400, 0.035, now);
        break;
    }
  }

  private tone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    startTime: number,
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, startTime);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), startTime + duration);
    }
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  private noise(duration: number, cutoffHz: number, volume: number, startTime: number): void {
    if (!this.ctx) return;
    const sampleCount = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, sampleCount, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(cutoffHz, startTime);
    filter.Q.setValueAtTime(1.4, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(startTime);
    src.stop(startTime + duration + 0.01);
  }
}

export const sfx = new SoundEngine();

export function playSfx(name: SfxName): void {
  sfx.play(name);
}

