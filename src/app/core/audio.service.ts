import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly auth = inject(AuthService);
  private ctx: AudioContext | null = null;

  private context(): AudioContext | null {
    if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
    this.ctx ??= new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  playChord(midis: number[], durationSec = 1.2, delaySec = 0): void {
    const ctx = this.context();
    if (!ctx) return;
    const start = ctx.currentTime + delaySec;
    const master = ctx.createGain();
    master.gain.value = 0.18 / Math.max(1, Math.sqrt(midis.length));
    master.connect(ctx.destination);

    for (const midi of midis) {
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const env = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(8000, freq * 8), start);
      filter.frequency.exponentialRampToValueAtTime(Math.max(200, freq * 1.5), start + durationSec);
      env.gain.setValueAtTime(0, start);
      env.gain.linearRampToValueAtTime(1, start + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, start + durationSec);
      osc.connect(filter).connect(env).connect(master);
      osc.start(start);
      osc.stop(start + durationSec + 0.05);
    }
  }

  playSequence(chords: number[][], beatSec = 0.55): void {
    chords.forEach((c, i) => this.playChord(c, beatSec * 1.6, i * beatSec));
  }

  cue(correct: boolean): void {
    if (this.auth.user()?.soundEnabled === false) return;
    if (correct) {
      this.playChord([76], 0.25);
      this.playChord([83], 0.35, 0.09);
    } else {
      this.playChord([52, 53], 0.35);
    }
  }
}
