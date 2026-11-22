import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { AudioService } from '../core/audio.service';
import { ReviewCard, ReviewRating, ReviewSummary } from '../core/models';
import { StatsStore } from '../core/stats.store';
import { NotationComponent } from '../shared/notation.component';

type Mode = 'idle' | 'due' | 'practice' | 'done';

@Component({
  selector: 'app-review',
  imports: [RouterLink, NotationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error()) {
      <div class="alert error">{{ error() }}</div>
    }

    @switch (mode()) {
      @case ('idle') {
        <header class="intro">
          <h1>Review</h1>
          <p class="muted">Each card comes back just before you would forget it. The better you know it, the longer it rests.</p>
        </header>
        @if (summary(); as s) {
          <section class="grid">
            <article class="leaf due">
              <span class="count numeral">{{ s.dueNow }}</span>
              <p class="count-label">card{{ s.dueNow === 1 ? '' : 's' }} due now</p>
              @if (s.dueNow > 0) {
                <button class="btn success block" (click)="start('due')">Start review</button>
              } @else if (s.totalLearned === 0) {
                <p class="muted">Finish a lesson and its key ideas will be added here.</p>
                <a class="btn block" routerLink="/learn">Go to the course</a>
              } @else {
                <p class="muted">You are up to date.</p>
              }
              @if (s.totalLearned > 0) {
                <button class="link-btn" (click)="start('practice')">Practise without changing your schedule</button>
              }
            </article>

            <article class="calendar">
              <h3>The week ahead</h3>
              <ol class="days">
                @for (u of s.upcoming; track u.date) {
                  <li [class.has]="u.count > 0">
                    <span class="dname">{{ weekday(u.date) }}</span>
                    <span class="dots" aria-hidden="true">
                      @for (x of dots(u.count); track $index) { <i></i> }
                    </span>
                    <span class="numeral n">{{ u.count || '' }}</span>
                  </li>
                }
              </ol>
              <p class="muted small">{{ s.totalLearned }} cards learned. {{ s.reviewedToday }} reviewed today.</p>
            </article>
          </section>
        } @else if (!error()) {
          <div class="spinner"></div>
        }
      }

      @case ('done') {
        <div class="leaf finish">
          <h1>Session complete.</h1>
          <p class="muted">{{ reviewed() }} card{{ reviewed() === 1 ? '' : 's' }} reviewed, {{ xp() }} XP earned.</p>
          <div class="row">
            <button class="btn" (click)="backToOverview()">Done</button>
            <a routerLink="/learn">Learn something new</a>
          </div>
        </div>
      }

      @default {
        @if (card(); as c) {
          <div class="session">
            <div class="head">
              <button class="link-btn" (click)="backToOverview()">End session</button>
              <div class="progress"><span [style.width.%]="sessionPct()"></span></div>
              <span class="muted small">{{ mode() === 'practice' ? 'Practice' : 'Review' }}, {{ index() + 1 }} of {{ cards().length }}</span>
            </div>

            <article class="leaf flash">
              <span class="from">From “{{ c.lessonTitle }}”</span>
              <h2>{{ c.front }}</h2>
              @if (c.notation; as n) {
                <app-notation [notation]="n" />
              }
              @if (revealed()) {
                <div class="answer">
                  <p>{{ c.back }}</p>
                </div>
              }
            </article>

            @if (!revealed()) {
              <button class="btn block" (click)="reveal()">Show answer</button>
              <p class="muted small center">Answer in your head first, or play it at the keyboard.</p>
            } @else {
              <p class="muted small center">How well did you remember it?</p>
              <div class="ratings">
                @for (r of ratings; track r.value; let i = $index) {
                  <button [class]="'btn ' + r.cls" (click)="rate(r.value)" [disabled]="busy()">
                    <span>{{ r.value }}</span><small>{{ r.hint }}</small>
                  </button>
                }
              </div>
            }
          </div>
        }
      }
    }
  `,
  styles: `
    .intro { margin-bottom: 2rem; }
    .intro p { max-width: 36rem; }
    .grid { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: 2.5rem; align-items: start; }
    .due { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 2rem; }
    .count { font-size: 4.5rem; line-height: 1; color: var(--violet); }
    .count-label { margin: -0.4rem 0 0.5rem; font-weight: 700; }
    .calendar h3 { margin-bottom: 0.75rem; }
    .days { list-style: none; padding: 0; margin: 0 0 1rem; border-top: 2px solid var(--rule-soft); }
    .days li { display: grid; grid-template-columns: 4.5rem 1fr 2rem; align-items: center; gap: 0.75rem; padding: 0.45rem 0; border-bottom: 1px solid var(--rule-soft); }
    .dname { color: var(--muted); }
    .has .dname { color: var(--ink); font-weight: 700; }
    .dots { display: flex; flex-wrap: wrap; gap: 4px; }
    .dots i { width: 10px; height: 10px; border-radius: 50%; background: var(--lilac-deep); }
    .n { text-align: right; font-size: 1.1rem; }

    .session { max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
    .head { display: flex; align-items: center; gap: 1rem; }
    .head .progress { flex: 1; height: 2px; }
    .flash { min-height: 260px; display: flex; flex-direction: column; gap: 0.75rem; padding: 2rem; }
    .from { font: italic 500 1rem var(--font-display); color: var(--muted); }
    .flash h2 { font-size: 1.6rem; margin: 0; }
    .answer { border-top: 2px solid var(--rule-soft); padding-top: 1rem; margin-top: 0.5rem; animation: pop 0.2s; }
    .answer p { font: 600 1.45rem/1.35 var(--font-display); color: var(--cobalt-deep); margin: 0; }
    .ratings { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.6rem; }
    .ratings .btn { flex-direction: column; gap: 0; padding: 0.55rem 0.4rem; }
    .ratings small { font-size: 0.78rem; font-weight: 500; opacity: 0.85; }
    .btn.again { --btn-bg: var(--lacca); --btn-edge: var(--lacca-deep); }
    .btn.hard { --btn-bg: var(--naples); --btn-fg: var(--ink); --btn-edge: var(--naples-deep); }
    .btn.good { --btn-bg: var(--verdigris); --btn-edge: var(--verdigris-deep); }
    .finish { max-width: 480px; margin: 2rem auto; padding: 2.25rem; border-top: 4px solid var(--verdigris); }
    @media (max-width: 760px) { .grid { grid-template-columns: 1fr; gap: 2rem; } .ratings { grid-template-columns: 1fr 1fr; } .flash { padding: 1.4rem; } }
  `,
  host: { '(document:keydown)': 'onKey($event)' },
})
export class ReviewPage {
  private readonly api = inject(ApiService);
  private readonly audio = inject(AudioService);
  private readonly stats = inject(StatsStore);

  protected readonly summary = signal<ReviewSummary | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly mode = signal<Mode>('idle');
  protected readonly cards = signal<ReviewCard[]>([]);
  protected readonly index = signal(0);
  protected readonly revealed = signal(false);
  protected readonly busy = signal(false);
  protected readonly reviewed = signal(0);
  protected readonly xp = signal(0);

  protected readonly card = computed(() => this.cards()[this.index()] ?? null);
  protected readonly sessionPct = computed(() => (this.cards().length ? (100 * this.index()) / this.cards().length : 0));

  protected readonly ratings: { value: ReviewRating; hint: string; cls: string }[] = [
    { value: 'Again', hint: 'Forgot it', cls: 'again' },
    { value: 'Hard', hint: 'Slow to recall', cls: 'hard' },
    { value: 'Good', hint: 'Remembered', cls: 'good' },
    { value: 'Easy', hint: 'Instantly', cls: '' },
  ];

  constructor() {
    void this.loadSummary();
  }

  private async loadSummary(): Promise<void> {
    try {
      this.summary.set(await this.api.reviewSummary());
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }

  protected dots(count: number): number[] {
    return Array.from({ length: Math.min(count, 24) });
  }

  protected weekday(date: string): string {
    return new Date(date + 'T00:00').toLocaleDateString(undefined, { weekday: 'long' });
  }

  protected async start(mode: 'due' | 'practice'): Promise<void> {
    this.error.set(null);
    try {
      const cards = mode === 'due' ? await this.api.dueReviews(30) : await this.api.practiceReviews(10);
      if (!cards.length) {
        this.error.set('There are no cards to review yet.');
        return;
      }
      this.cards.set(cards);
      this.index.set(0);
      this.revealed.set(false);
      this.reviewed.set(0);
      this.xp.set(0);
      this.mode.set(mode);
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }

  protected reveal(): void {
    this.revealed.set(true);
  }

  protected async rate(rating: ReviewRating): Promise<void> {
    const c = this.card();
    if (!c || this.busy()) return;
    this.busy.set(true);
    try {
      const res = await this.api.rateReview(c.stateId, rating, this.mode() === 'practice');
      this.audio.cue(rating !== 'Again');
      this.reviewed.update((n) => n + 1);
      this.xp.update((x) => x + res.xpEarned);
      if (rating === 'Again' && this.mode() === 'due') this.cards.update((cs) => [...cs, c]);
      if (this.index() + 1 >= this.cards().length) {
        this.mode.set('done');
        void this.stats.refresh().catch(() => undefined);
      } else {
        this.index.update((i) => i + 1);
        this.revealed.set(false);
      }
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected backToOverview(): void {
    this.mode.set('idle');
    this.summary.set(null);
    void this.loadSummary();
  }

  protected onKey(e: KeyboardEvent): void {
    if (this.mode() !== 'due' && this.mode() !== 'practice') return;
    if (!this.revealed() && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      this.reveal();
    } else if (this.revealed() && ['1', '2', '3', '4'].includes(e.key)) {
      void this.rate(this.ratings[Number(e.key) - 1].value);
    }
  }
}
