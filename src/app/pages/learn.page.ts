import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { Chapter, LessonNode } from '../core/models';
import { LadderNote, LadderState, RULE_OF_OCTAVE_FIGURES, StaffLadderComponent } from '../shared/staff-ladder.component';

@Component({
  selector: 'app-learn',
  imports: [RouterLink, StaffLadderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="intro">
      <h1>Your course</h1>
      <p class="muted">Each chapter is a bass line that climbs as you learn. Finished lessons fill in on the staff, and golden notes are the ones you've mastered.</p>
    </header>

    @if (error()) {
      <div class="alert error">{{ error() }}</div>
    }

    @if (chapters(); as chapters) {
      @for (c of chapters; track c.id) {
        <section class="card chapter" [class.sealed]="c.premiumLocked" [attr.aria-labelledby]="'ch-' + c.id">
          <header class="tile chapter-head" [class]="'tile chapter-head ' + tint(c.number)">
            <div>
              <span class="chapter-no">Chapter {{ roman(c.number) }}</span>
              <h2 [id]="'ch-' + c.id">{{ c.title }}</h2>
              <p class="muted">{{ c.subtitle }}</p>
            </div>
            <div class="count">
              @if (c.premiumLocked) {
                <a class="btn gold small" routerLink="/premium">Unlock with Premium</a>
              } @else {
                <span class="numeral big">{{ c.completedLessons }}<small>/{{ c.totalLessons }}</small></span>
                <span class="count-label">lessons done</span>
                <div class="progress"><span [style.width.%]="c.progressPercent"></span></div>
              }
            </div>
          </header>

          <app-staff-ladder
            [notes]="ladder(c)"
            [interactive]="true"
            [selectedIndex]="selectedIndex(c)"
            (select)="select(c.lessons[$event].id)"
          />

          <ol class="lessons">
            @for (l of c.lessons; track l.id; let i = $index) {
              <li [class.open]="selected() === l.id" [class.locked]="l.state === 'Locked'">
                <button type="button" class="row-btn" (click)="select(l.id)" [attr.aria-expanded]="selected() === l.id">
                  <span class="deg numeral">{{ i + 1 }}</span>
                  <span class="title">{{ l.title }}</span>
                  <span class="status" [class]="'status ' + statusClass(l)">{{ statusLabel(l) }}</span>
                  <span class="chev" aria-hidden="true">{{ selected() === l.id ? '–' : '+' }}</span>
                </button>
                @if (selected() === l.id) {
                  <div class="detail">
                    <p>{{ l.summary }}</p>
                    <div class="row">
                      @switch (true) {
                        @case (l.requiresPremium) {
                          <a class="btn gold" routerLink="/premium">Unlock with Premium</a>
                        }
                        @case (l.state === 'Locked') {
                          <span class="muted">Finish “{{ previousTitle(c, i) }}” to open this lesson.</span>
                        }
                        @case (l.state === 'Available') {
                          <a class="btn" [routerLink]="['/lesson', l.slug]">Start lesson</a>
                          <span class="muted small">{{ l.xpReward }} XP</span>
                        }
                        @default {
                          <a class="btn ghost" [routerLink]="['/lesson', l.slug]">Practise again</a>
                          <span class="muted small">
                            Best score {{ (l.bestScore * 100).toFixed(0) }}%.
                            @if (l.state !== 'Mastered') { Answer every question right first time to master it. }
                          </span>
                        }
                      }
                    </div>
                  </div>
                }
              </li>
            }
          </ol>
        </section>
      }
    } @else if (!error()) {
      <div class="spinner"></div>
    }
  `,
  styles: `
    :host { display: block; max-width: 840px; margin: 0 auto; }
    .intro { margin-bottom: 1.75rem; }
    .intro p { max-width: 38rem; }
    .chapter { margin-bottom: 2.5rem; padding: 0.75rem 0.75rem 1rem; }
    .chapter.sealed app-staff-ladder { opacity: 0.45; filter: grayscale(0.4); }
    .chapter-head { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem; padding: 1.4rem 1.6rem; }
    .chapter-head h2 { margin: 0.1rem 0 0.2rem; font-size: 1.9rem; }
    .chapter-head p { margin: 0; color: var(--ink-soft); }
    .chapter-no { font: italic 600 1.1rem var(--font-display); color: var(--violet-deep); }
    .count { min-width: 120px; text-align: right; }
    .big { font-size: 2rem; }
    .big small { font-size: 1.1rem; color: var(--ink-soft); }
    .count-label { display: block; font-weight: 700; font-size: 0.85rem; color: var(--ink-soft); margin-bottom: 0.4rem; }
    .count .progress { background: rgba(255, 255, 255, 0.65); height: 8px; }
    app-staff-ladder { margin: 0 0.75rem 1.25rem; }

    .lessons { list-style: none; margin: 0; padding: 0 0.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .lessons li { border-radius: 18px; transition: background-color 0.15s; }
    .lessons li:hover { background: var(--paper); }
    .lessons li.open { background: var(--violet-soft); }
    .row-btn { width: 100%; display: grid; grid-template-columns: 2.4rem 1fr auto 1.2rem; align-items: center; gap: 0.85rem; padding: 0.65rem 0.75rem;
      background: none; border: none; text-align: left; font: inherit; color: inherit; cursor: pointer; border-radius: 18px; }
    .deg { display: grid; place-items: center; width: 2.4rem; height: 2.4rem; border-radius: 50%; background: var(--violet-soft); color: var(--violet); font-size: 1.05rem; }
    .open .deg { background: var(--violet); color: #fff; }
    .title { font-weight: 800; }
    .locked .title { color: var(--muted); }
    .locked .deg { background: var(--paper-deep); color: var(--pencil); }
    .status { font-size: 0.82rem; font-weight: 800; padding: 0.15rem 0.65rem; border-radius: 999px; color: var(--muted); background: var(--paper-deep); }
    .status.done { color: var(--verdigris-deep); background: var(--verdigris-wash); }
    .status.mastered { color: #7a5200; background: var(--butter); }
    .status.next { color: #fff; background: var(--violet); }
    .chev { font-weight: 800; color: var(--muted); text-align: center; }
    .detail { padding: 0 1rem 1rem 4.1rem; animation: pop 0.18s ease-out; }
    .detail p { color: var(--ink-soft); margin-bottom: 0.75rem; }
    @media (max-width: 600px) {
      .chapter-head { flex-direction: column; align-items: flex-start; padding: 1.2rem; }
      .count { text-align: left; width: 100%; }
      .detail { padding-left: 1rem; }
      .row-btn { grid-template-columns: 2.4rem 1fr auto; }
      .chev { display: none; }
      app-staff-ladder { margin: 0 0 1rem; }
    }
  `,
})
export class LearnPage {
  private readonly api = inject(ApiService);
  protected readonly chapters = signal<Chapter[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly selected = signal<number | null>(null);
  private currentId: number | null = null;
  private ladders = new Map<number, LadderNote[]>();

  constructor() {
    this.api
      .curriculum()
      .then((c) => {
        this.currentId = c.flatMap((x) => x.lessons).find((l) => l.state === 'Available' && !l.requiresPremium)?.id ?? null;
        this.selected.set(this.currentId);
        this.ladders.clear();
        this.chapters.set(c);
      })
      .catch((e) => this.error.set(errorMessage(e)));
  }

  protected ladder(c: Chapter): LadderNote[] {
    let notes = this.ladders.get(c.id);
    if (!notes) {
      notes = c.lessons.map((l, i) => ({
        figures: RULE_OF_OCTAVE_FIGURES[i % RULE_OF_OCTAVE_FIGURES.length],
        degree: String(i + 1),
        state: this.ladderState(l),
        label: `${l.title}, ${this.statusLabel(l)}`,
      }));
      this.ladders.set(c.id, notes);
    }
    return notes;
  }

  protected selectedIndex(c: Chapter): number | null {
    const i = c.lessons.findIndex((l) => l.id === this.selected());
    return i < 0 ? null : i;
  }

  protected select(id: number): void {
    this.selected.update((v) => (v === id ? null : id));
  }

  protected previousTitle(c: Chapter, i: number): string {
    return i > 0 ? c.lessons[i - 1].title : 'the previous chapter';
  }

  protected statusLabel(l: LessonNode): string {
    if (l.requiresPremium) return 'Premium';
    if (l.id === this.currentId) return 'Up next';
    return { Locked: 'Not yet open', Available: 'Open', Completed: 'Done', Mastered: 'Mastered' }[l.state];
  }

  protected statusClass(l: LessonNode): string {
    if (l.id === this.currentId) return 'next';
    return l.state === 'Mastered' ? 'mastered' : l.state === 'Completed' ? 'done' : '';
  }

  protected tint(n: number): string {
    return ['butter', 'lilac', 'sky', 'mint', 'pink'][(n - 1) % 5];
  }

  protected roman(n: number): string {
    return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] ?? String(n);
  }

  private ladderState(l: LessonNode): LadderState {
    if (l.id === this.currentId) return 'current';
    if (l.state === 'Mastered') return 'mastered';
    if (l.state === 'Completed') return 'completed';
    if (l.state === 'Available' && !l.requiresPremium) return 'available';
    return 'locked';
  }
}
