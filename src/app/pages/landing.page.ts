import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AudioService } from '../core/audio.service';
import { AuthService } from '../core/auth.service';
import { IconComponent } from '../shared/icon.component';
import { MascotComponent } from '../shared/mascot.component';
import { LadderNote, RULE_OF_OCTAVE_FIGURES, RULE_OF_OCTAVE_VOICINGS, StaffLadderComponent } from '../shared/staff-ladder.component';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, StaffLadderComponent, MascotComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="container nav">
      <a routerLink="/" class="brand"><span class="logo">IF</span> Improvising Fugue</a>
      @if (auth.isAuthenticated()) {
        <a class="btn small" routerLink="/dashboard">Open the app</a>
      } @else {
        <a class="btn ghost small" routerLink="/login">Sign in</a>
      }
    </header>

    <section class="container hero">
      <div class="copy">
        <h1>Learn to improvise at the keyboard, one small lesson a day.</h1>
        <p class="lede">
          Bite-size lessons in partimento and figured bass, the playful method eighteenth-century Naples used to turn students into
          composers. Read a bass line, hear its harmony, then play it yourself.
        </p>
        <div class="cta">
          @if (auth.isAuthenticated()) {
            <a class="btn" routerLink="/learn">Continue learning</a>
          } @else {
            <a class="btn" routerLink="/register">Start learning for free</a>
            <a routerLink="/login">I already have an account</a>
          }
        </div>
      </div>
      <div class="hero-art">
        <span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span>
        <app-mascot class="bob" mood="wave" [size]="230" />
        <span class="bubble">Hallo! Shall we improvise?</span>
      </div>
    </section>

    <section class="container demo">
      <article class="card demo-card">
        <div class="demo-head">
          <div>
            <h2>Try it: the Rule of the Octave</h2>
            <p class="muted">One chord for every step of the scale. It's the first thing you'll learn, and you can hear it right now.</p>
          </div>
          <button type="button" class="btn small" (click)="play()" [disabled]="playing() !== null">
            <app-icon name="play" [size]="18" /> {{ playing() === null ? 'Hear it played' : 'Playing…' }}
          </button>
        </div>
        <app-staff-ladder [notes]="heroNotes" [activeIndex]="playing()" />
      </article>
    </section>

    <section class="container features">
      <h2 class="center">What you'll do in every lesson</h2>
      <div class="tiles">
        @for (f of features; track f.title) {
          <article class="tile" [class]="'tile ' + f.color">
            <span class="ficon"><app-icon [name]="f.icon" [size]="28" /></span>
            <h3>{{ f.title }}</h3>
            <p>{{ f.text }}</p>
          </article>
        }
      </div>
    </section>

    <section class="container path">
      <div class="path-copy">
        <h2>Your path through the course</h2>
        <p class="muted">Start with the foundations in Chapter 1, free forever. Premium opens later chapters, from cadences all the way to improvised fugue.</p>
      </div>
      <ol class="chapter-list">
        @for (l of chapterOne; track l; let i = $index) {
          <li><span class="num">{{ i + 1 }}</span>{{ l }}</li>
        }
      </ol>
    </section>

    <section class="container closing">
      <div class="tile violet closing-tile">
        <app-mascot mood="cheer" [size]="120" />
        <div>
          <h2>Your first lesson takes about five minutes.</h2>
          <p>No card needed. Your progress is saved as you go.</p>
        </div>
        @if (auth.isAuthenticated()) {
          <a class="btn gold" routerLink="/learn">Continue learning</a>
        } @else {
          <a class="btn gold" routerLink="/register">Start learning for free</a>
        }
      </div>
    </section>

    <footer class="container foot small muted">
      The course sequence is inspired by John J. Mortensen's <em>Improvising Fugue: A Method for Keyboard Artists</em>. Lesson text and
      musical examples are original. Not affiliated with the author or publisher.
    </footer>
  `,
  styles: `
    .nav { display: flex; align-items: center; justify-content: space-between; height: 80px; }
    .brand { display: flex; align-items: center; gap: 0.6rem; font: 600 1.3rem var(--font-display); color: var(--ink); }
    .brand:hover { text-decoration: none; }
    .logo { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; background: var(--violet); color: #fff; font-size: 1rem;
      box-shadow: 0 4px 0 var(--violet-deep); }

    .hero { display: grid; grid-template-columns: 1.15fr 1fr; gap: 2rem; align-items: center; padding-top: 2rem; padding-bottom: 2.5rem; }
    .hero h1 { max-width: 17ch; margin-bottom: 1rem; }
    .lede { font-size: 1.12rem; color: var(--ink-soft); max-width: 34rem; }
    .cta { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; margin-top: 1.5rem; }
    .hero-art { position: relative; display: grid; place-items: center; min-height: 340px; }
    .blob { position: absolute; border-radius: 40% 60% 55% 45%; }
    .b1 { width: 300px; height: 280px; background: var(--butter); }
    .b2 { width: 90px; height: 90px; background: var(--lilac); top: 18px; right: 40px; border-radius: 50%; }
    .b3 { width: 60px; height: 60px; background: var(--pink); bottom: 30px; left: 40px; border-radius: 50%; }
    .hero-art app-mascot { position: relative; }
    .bubble { position: absolute; top: 34px; left: 6%; background: #fff; padding: 0.55rem 1rem; border-radius: 18px 18px 18px 4px; font: italic 600 1.05rem var(--font-display);
      box-shadow: var(--shadow); }

    .demo { padding-bottom: 3.5rem; }
    .demo-card { padding: 1.75rem 2rem; }
    .demo-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; margin-bottom: 0.5rem; }
    .demo-head p { margin: 0; max-width: 34rem; }
    .demo-head .btn { flex-shrink: 0; }

    .features { padding-bottom: 3.5rem; }
    .tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-top: 1.5rem; }
    .tiles .tile { padding: 1.4rem 1.25rem 1.5rem; }
    .tiles h3 { margin: 0.75rem 0 0.35rem; }
    .tiles p { margin: 0; color: var(--ink-soft); font-size: 0.95rem; }
    .ficon { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; background: rgba(255, 255, 255, 0.65); color: var(--violet-deep); }

    .path { display: grid; grid-template-columns: 1fr 1.1fr; gap: 2.5rem; align-items: center; padding-bottom: 3.5rem; }
    .chapter-list { list-style: none; margin: 0; padding: 1rem; background: #fff; border-radius: var(--radius-lg); box-shadow: var(--shadow); }
    .chapter-list li { display: flex; align-items: center; gap: 0.9rem; padding: 0.55rem 0.5rem; font-weight: 700; }
    .chapter-list li + li { border-top: 1px solid var(--rule-soft); }
    .num { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--violet-soft); color: var(--violet); font: 600 1rem var(--font-display); flex-shrink: 0; }

    .closing { padding-bottom: 2rem; }
    .closing-tile { display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem 2rem; flex-wrap: wrap; }
    .closing-tile > div { flex: 1; min-width: 220px; }
    .closing-tile app-mascot { background: var(--butter); border-radius: 50%; padding: 10px 6px 0; box-shadow: 0 5px 0 var(--butter-deep); }
    .closing-tile h2 { color: #fff; margin: 0 0 0.25rem; }
    .closing-tile p { margin: 0; opacity: 0.9; }
    .foot { padding-top: 1.5rem; padding-bottom: 3rem; max-width: 46rem; text-align: center; }

    @media (max-width: 900px) {
      .hero { grid-template-columns: 1fr; padding-top: 0.5rem; }
      .hero-art { min-height: 280px; order: -1; }
      .tiles { grid-template-columns: 1fr 1fr; }
      .path { grid-template-columns: 1fr; gap: 1.25rem; }
    }
    @media (max-width: 560px) {
      .tiles { grid-template-columns: 1fr; }
      .demo-head { flex-direction: column; }
      .demo-card { padding: 1.25rem; }
      .closing-tile { justify-content: center; text-align: center; }
    }
  `,
})
export class LandingPage {
  protected readonly auth = inject(AuthService);
  private readonly audio = inject(AudioService);
  protected readonly playing = signal<number | null>(null);

  protected readonly heroNotes: LadderNote[] = RULE_OF_OCTAVE_FIGURES.map((figures, i) => ({
    figures,
    degree: String(i + 1),
    state: 'plain',
    label: `Scale degree ${i + 1}, figured ${figures.join(' ')}`,
  }));

  protected readonly features = [
    { icon: 'learn', color: 'butter', title: 'Short lessons', text: 'Five minutes, instant feedback, and you always know what to do next.' },
    { icon: 'note', color: 'pink', title: 'Real music', text: 'See and hear every example, and answer on a piano keyboard.' },
    { icon: 'review', color: 'mint', title: 'Smart review', text: 'Key patterns come back just before you would forget them.' },
    { icon: 'flame', color: 'lilac', title: 'Streaks and XP', text: 'Earn experience and keep your daily streak glowing.' },
  ];

  protected readonly chapterOne = [
    'What is partimento?',
    'Recognize, realize, stylize',
    'Introduction to figured bass',
    'Rule of the Octave in major',
    'Rule of the Octave in minor',
    'The 4–6 exceptions',
    'Chapter 1 practice and review',
  ];

  protected play(): void {
    const beat = 650;
    RULE_OF_OCTAVE_VOICINGS.forEach((_, i) => setTimeout(() => this.playing.set(i), i * beat));
    setTimeout(() => this.playing.set(null), RULE_OF_OCTAVE_VOICINGS.length * beat + 300);
    this.audio.playSequence(RULE_OF_OCTAVE_VOICINGS, beat / 1000);
  }
}
