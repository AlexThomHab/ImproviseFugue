import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { StatsStore } from '../core/stats.store';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="masthead">
      <div class="container bar">
        <a routerLink="/dashboard" class="brand"><span class="logo">IF</span><span class="brand-name">Improvising Fugue</span></a>

        <nav class="links" aria-label="Main">
          @for (l of links; track l.path) {
            <a [routerLink]="l.path" routerLinkActive="active">
              <app-icon [name]="l.icon" [size]="20" />{{ l.label }}
              @if (l.path === '/review' && dueNow() > 0) {
                <span class="due" [attr.aria-label]="dueNow() + ' due'">{{ dueNow() }}</span>
              }
            </a>
          }
        </nav>

        <div class="chips">
          <span class="chip streak" [class.lit]="activeToday()" [title]="activeToday() ? 'Streak kept today' : 'Practise today to keep your streak'">
            <app-icon name="flame" [size]="20" /><span class="numeral">{{ streak() }}</span>
          </span>
          <span class="chip xp" title="Total experience"><app-icon name="star" [size]="19" /><span class="numeral">{{ xp() }}</span></span>
          @if (auth.isPremium()) {
            <span class="chip premium" title="Premium member"><app-icon name="crown" [size]="18" /></span>
          } @else {
            <a routerLink="/premium" class="chip upgrade">Go Premium</a>
          }
        </div>
      </div>
    </header>

    <main class="container content">
      <router-outlet />
    </main>

    <nav class="bottom" aria-label="Main">
      @for (l of links; track l.path) {
        <a [routerLink]="l.path" routerLinkActive="active">
          <app-icon [name]="l.icon" [size]="24" />
          <span>{{ l.label }}</span>
          @if (l.path === '/review' && dueNow() > 0) {
            <span class="due">{{ dueNow() }}</span>
          }
        </a>
      }
    </nav>
  `,
  styles: `
    :host { display: block; min-height: 100dvh; }
    .masthead { position: sticky; top: 0; z-index: 20; background: color-mix(in srgb, var(--paper) 92%, transparent); backdrop-filter: blur(8px); }
    .bar { display: flex; align-items: center; gap: 2rem; height: 72px; }
    .brand { display: flex; align-items: center; gap: 0.6rem; color: var(--ink); }
    .brand:hover { text-decoration: none; }
    .logo { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; background: var(--violet); color: #fff;
      font: 600 1rem var(--font-display); box-shadow: 0 4px 0 var(--violet-deep); }
    .brand-name { font: 600 1.3rem var(--font-display); white-space: nowrap; }
    .links { display: flex; gap: 0.35rem; }
    .links a { position: relative; display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.5rem 0.95rem; border-radius: 999px; color: var(--ink-soft); font-weight: 800; }
    .links a:hover { background: var(--paper-deep); text-decoration: none; }
    .links a.active { background: #fff; color: var(--violet); box-shadow: var(--shadow); }
    .due { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px; background: var(--lacca); color: #fff; font-size: 0.72rem; font-weight: 800;
      display: inline-grid; place-items: center; }
    .chips { margin-left: auto; display: flex; align-items: center; gap: 0.5rem; }
    .chip { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.35rem 0.75rem; border-radius: 999px; background: #fff; box-shadow: var(--shadow); font-weight: 800; }
    .chip .numeral { font-size: 1.1rem; }
    .streak { color: var(--pencil); }
    .streak.lit { color: var(--flame); }
    .streak .numeral, .xp .numeral { color: var(--ink); }
    .xp { color: var(--naples); }
    .premium { color: var(--naples-deep); background: var(--naples-wash); }
    .upgrade { color: var(--violet); }
    .upgrade:hover { text-decoration: none; background: var(--violet-soft); }
    .content { padding-top: 1.75rem; padding-bottom: 6rem; }
    .bottom { display: none; }

    @media (max-width: 900px) {
      .links { display: none; }
      .brand-name { display: none; }
      .upgrade { display: none; }
      .bottom { display: grid; grid-template-columns: repeat(4, 1fr); position: fixed; bottom: 0; left: 0; right: 0; z-index: 20;
        background: #fff; box-shadow: 0 -6px 24px -12px rgba(56, 44, 140, 0.25); border-radius: 22px 22px 0 0; padding: 6px 8px calc(6px + env(safe-area-inset-bottom)); }
      .bottom a { position: relative; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 6px 0; color: var(--muted); font-size: 0.75rem; }
      .bottom a:hover { text-decoration: none; }
      .bottom a.active { color: var(--violet); }
      .bottom .due { position: absolute; top: 0; left: calc(50% + 6px); }
    }
  `,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly stats = inject(StatsStore);

  protected readonly links = [
    { path: '/dashboard', label: 'Home', icon: 'home' },
    { path: '/learn', label: 'Course', icon: 'learn' },
    { path: '/review', label: 'Review', icon: 'review' },
    { path: '/account', label: 'Profile', icon: 'user' },
  ];

  protected readonly dueNow = computed(() => this.stats.dashboard()?.reviews.dueNow ?? 0);
  protected readonly streak = computed(() => this.stats.dashboard()?.currentStreak ?? 0);
  protected readonly xp = computed(() => this.stats.dashboard()?.totalXp ?? 0);
  protected readonly activeToday = computed(() => this.stats.dashboard()?.activeToday ?? false);

  constructor() {
    void this.stats.refresh().catch(() => undefined);
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => void this.stats.refresh().catch(() => undefined));
  }
}
