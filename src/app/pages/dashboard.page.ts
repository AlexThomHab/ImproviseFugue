import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../core/api.service';
import { StatsStore } from '../core/stats.store';
import { IconComponent } from '../shared/icon.component';
import { MascotComponent } from '../shared/mascot.component';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, IconComponent, MascotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error()) {
      <div class="alert error">{{ error() }}</div>
    }
    @if (d(); as d) {
      <header class="hello">
        <div>
          <h1>{{ greeting() }}, {{ d.displayName }}!</h1>
          <p class="muted">
            @if (d.activeToday) {
              You've practised today. Your streak is safe.
            } @else if (d.currentStreak > 0) {
              One short lesson keeps your {{ d.currentStreak }}-day streak going.
            } @else {
              Nice to see you. One lesson today starts a new streak.
            }
          </p>
        </div>
        <app-mascot class="bob" [mood]="d.activeToday ? 'happy' : 'wave'" [size]="110" />
      </header>

      <section class="continue tile violet">
        @if (d.nextLesson; as next) {
          <div class="continue-copy">
            <span class="eyebrow">{{ next.state === 'Available' ? 'Up next' : 'Worth another go' }}</span>
            <h2>{{ next.title }}</h2>
            <p>{{ next.summary }}</p>
          </div>
          <a class="btn gold" [routerLink]="['/lesson', next.slug]">{{ next.state === 'Available' ? 'Start lesson' : 'Practise again' }}</a>
        } @else {
          <div class="continue-copy">
            <span class="eyebrow">All caught up</span>
            <h2>You've finished every open lesson.</h2>
            <p>{{ d.isPremium ? 'New chapters will appear here as they are released.' : 'The next chapters, all the way to fugue, are part of Premium.' }}</p>
          </div>
          @if (!d.isPremium) {
            <a class="btn gold" routerLink="/premium">See Premium</a>
          }
        }
      </section>

      <section class="stats">
        <article class="tile butter stat">
          <app-icon name="flame" [size]="30" />
          <span class="value numeral">{{ d.currentStreak }}</span>
          <span class="label">day streak</span>
        </article>
        <article class="tile lilac stat">
          <app-icon name="star" [size]="30" />
          <span class="value numeral">{{ d.totalXp }}</span>
          <span class="label">total XP</span>
        </article>
        <article class="tile mint stat">
          <app-icon name="target" [size]="30" />
          <span class="value numeral">{{ d.xpToday }}<small>/{{ d.dailyGoalXp }}</small></span>
          <span class="label">today's goal</span>
          <div class="progress violet"><span [style.width.%]="goalPct()"></span></div>
        </article>
        <a class="tile pink stat link" routerLink="/review">
          <app-icon name="review" [size]="30" />
          <span class="value numeral">{{ d.reviews.dueNow }}</span>
          <span class="label">{{ d.reviews.dueNow === 1 ? 'card' : 'cards' }} to review</span>
        </a>
      </section>

      <section class="lower">
        <article class="card">
          <h3>This week</h3>
          <div class="week" aria-label="Experience over the last seven days">
            @for (day of d.lastSevenDays; track day.date) {
              <div class="col" [title]="day.xp + ' XP'">
                <div class="bar" [class.today]="$last" [style.height.%]="barHeight(day.xp)"></div>
                <span>{{ weekday(day.date) }}</span>
              </div>
            }
          </div>
          <p class="muted small">
            @if (d.reviews.dueNow === 0 && d.reviews.totalLearned > 0) { {{ nextUpcoming() }} }
            Longest streak: {{ d.longestStreak }} day{{ d.longestStreak === 1 ? '' : 's' }}.
          </p>
        </article>

        <article class="card">
          <div class="row"><h3>Your course</h3><span class="spacer"></span><span class="muted small">{{ d.lessonsCompleted }} of {{ d.totalLessons }} lessons</span></div>
          @for (c of d.chapters; track c.slug) {
            <a class="chapter" routerLink="/learn">
              <span class="roman">{{ roman(c.number) }}</span>
              <span class="ch-body">
                <span class="ch-title">{{ c.title }}</span>
                @if (c.premiumLocked) {
                  <span class="muted small"><app-icon name="lock" [size]="13" /> Premium</span>
                } @else {
                  <span class="progress"><span [style.width.%]="c.progressPercent"></span></span>
                }
              </span>
            </a>
          }
        </article>
      </section>
    } @else if (!error()) {
      <div class="spinner"></div>
    }
  `,
  styles: `
    .hello { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
    .hello p { margin: 0; }
    .continue { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 1.75rem 2rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .continue-copy { flex: 1; min-width: 240px; }
    .eyebrow { font: italic 600 1.05rem var(--font-display); color: var(--butter); }
    .continue h2 { color: #fff; font-size: 2rem; margin: 0.15rem 0 0.35rem; }
    .continue p { margin: 0; opacity: 0.9; max-width: 34rem; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2.25rem; }
    .stat { display: flex; flex-direction: column; gap: 0.1rem; padding: 1.1rem 1.25rem 1.25rem; color: var(--ink); }
    .stat app-icon { color: var(--violet-deep); margin-bottom: 0.35rem; }
    .stat.butter app-icon { color: var(--flame); }
    .value { font-size: 2rem; line-height: 1.1; }
    .value small { font-size: 1.05rem; color: var(--ink-soft); }
    .label { font-weight: 700; color: var(--ink-soft); }
    .stat .progress { margin-top: 0.5rem; height: 8px; background: rgba(255, 255, 255, 0.7); }
    .stat.link:hover { text-decoration: none; transform: translateY(-2px); }
    .stat.link { transition: transform 0.12s; }
    .lower { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; align-items: start; }
    .week { display: flex; gap: 0.6rem; align-items: flex-end; height: 120px; margin: 0.75rem 0 0.75rem; }
    .col { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 4px; }
    .col span { font-size: 0.78rem; color: var(--muted); font-weight: 700; }
    .bar { width: 100%; max-width: 30px; min-height: 6px; border-radius: 10px; background: var(--butter); }
    .bar.today { background: var(--naples-deep); }
    .chapter { display: flex; align-items: center; gap: 0.9rem; padding: 0.65rem 0; color: var(--ink); }
    .chapter + .chapter { border-top: 1px solid var(--rule-soft); }
    .chapter:hover { text-decoration: none; }
    .chapter:hover .ch-title { color: var(--violet); }
    .roman { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; background: var(--violet-soft); color: var(--violet);
      font: 600 1.05rem var(--font-display); flex-shrink: 0; }
    .ch-body { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
    .ch-title { font-weight: 800; }
    .ch-body .progress { height: 8px; }
    @media (max-width: 900px) { .stats { grid-template-columns: 1fr 1fr; } .lower { grid-template-columns: 1fr; } }
    @media (max-width: 520px) { .continue { padding: 1.4rem; } .continue .btn { width: 100%; } .hello app-mascot { display: none; } }
  `,
})
export class DashboardPage {
  private readonly stats = inject(StatsStore);
  protected readonly d = this.stats.dashboard;
  protected readonly error = signal<string | null>(null);

  protected readonly goalPct = computed(() => {
    const d = this.d();
    return d ? Math.min(100, (100 * d.xpToday) / Math.max(1, d.dailyGoalXp)) : 0;
  });

  protected readonly nextUpcoming = computed(() => {
    const next = this.d()?.reviews.upcoming.find((u) => u.count > 0);
    if (!next) return '';
    return `${next.count} review card${next.count === 1 ? '' : 's'} due ${new Date(next.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'long' })}.`;
  });

  private readonly maxXp = computed(() => Math.max(10, ...(this.d()?.lastSevenDays.map((x) => x.xp) ?? [0])));

  constructor() {
    this.stats.refresh().catch((e) => this.error.set(errorMessage(e)));
  }

  protected greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  protected roman(n: number): string {
    return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] ?? String(n);
  }

  protected barHeight(xp: number): number {
    return Math.max(5, (xp / this.maxXp()) * 100);
  }

  protected weekday(date: string): string {
    return new Date(date + 'T00:00').toLocaleDateString(undefined, { weekday: 'narrow' });
  }
}
