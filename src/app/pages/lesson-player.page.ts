import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService, errorCode, errorMessage } from '../core/api.service';
import { AudioService } from '../core/audio.service';
import { CheckAnswerResult, CompleteLessonResult, Exercise, ExerciseAnswer, LessonPlay } from '../core/models';
import { StatsStore } from '../core/stats.store';
import { IconComponent } from '../shared/icon.component';
import { MascotComponent } from '../shared/mascot.component';
import {
  InfoExerciseComponent,
  KeyboardExerciseComponent,
  MultipleChoiceComponent,
  OrderingComponent,
} from './exercises/exercises';

interface Step {
  uid: number;
  exercise: Exercise;
  retry: boolean;
}

@Component({
  selector: 'app-lesson-player',
  imports: [RouterLink, IconComponent, MascotComponent, InfoExerciseComponent, MultipleChoiceComponent, OrderingComponent, KeyboardExerciseComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="player">
      @if (error()) {
        <div class="center-box">
          <div class="alert" [class.warn]="blockedCode()" [class.error]="!blockedCode()">{{ error() }}</div>
          @if (blockedCode() === 'premium_required') {
            <a class="btn gold" routerLink="/premium">See Premium</a>
          }
          <a class="btn ghost" routerLink="/learn">Back to the course</a>
        </div>
      } @else if (result(); as r) {
        <div class="center-box done">
          <div class="card certificate">
            <app-mascot class="cheer" [mood]="r.isMastered ? 'cheer' : 'happy'" [size]="120" />
            <span class="kicker">{{ lesson()?.title }}</span>
            <h1>{{ r.newlyMastered ? 'Mastered.' : r.firstCompletion ? 'Lesson complete.' : 'Well practised.' }}</h1>
            <p class="muted">
              @if (r.newlyMastered) {
                Every answer right first time. This note is now gilded on your staff.
              } @else if (!r.isMastered) {
                Replay it with every answer right first time to master it.
              } @else {
                Repetition is how the Neapolitan students learned. Keep going.
              }
            </p>
            <div class="results">
              <div class="tile butter res"><span class="numeral">+{{ r.xpEarned }}</span><span>XP earned</span></div>
              <div class="tile mint res"><span class="numeral">{{ (r.score * 100).toFixed(0) }}%</span><span>first-try accuracy</span></div>
              <div class="tile pink res"><span class="numeral">{{ r.currentStreak }}</span><span>day streak</span></div>
            </div>
            <ul class="notes">
              @if (r.streakExtended) {
                <li class="streak">Your streak grew to {{ r.currentStreak }} day{{ r.currentStreak === 1 ? '' : 's' }}.</li>
              }
              @if (r.reviewItemsScheduled > 0) {
                <li>{{ r.reviewItemsScheduled }} review card{{ r.reviewItemsScheduled === 1 ? '' : 's' }} added. They return tomorrow.</li>
              }
              @for (u of r.unlockedLessons; track u.id) {
                <li class="opened">Now open: {{ u.title }}</li>
              }
            </ul>
            <div class="row actions">
              @if (r.nextLesson) {
                <button class="btn" (click)="goTo(r.nextLesson.slug)">Next lesson</button>
              }
              <a class="btn ghost" routerLink="/learn">Back to the course</a>
            </div>
          </div>
        </div>
      } @else if (lesson(); as l) {
        <header class="top">
          <a routerLink="/learn" class="close" aria-label="Leave lesson"><app-icon name="x" [size]="22" /></a>
          <div class="progress lesson-progress" role="progressbar" [attr.aria-valuenow]="progressPct()" aria-valuemin="0" aria-valuemax="100">
            <span [style.width.%]="progressPct()"></span>
          </div>
          <span class="combo" [class.hot]="combo() >= 3" title="Correct answers in a row">
            <app-icon name="flame" [size]="16" /><span class="numeral">{{ combo() }}</span>
          </span>
        </header>

        <main class="stage">
          <p class="lesson-name">{{ l.title }}</p>
          @for (s of currentStep(); track s.uid) {
            <div class="card sheet">
              @if (s.retry) {
                <p class="retry">Let's try this one again.</p>
              }
              @switch (s.exercise.type) {
                @case ('info') { <app-info-exercise [exercise]="s.exercise" /> }
                @case ('multipleChoice') { <app-multiple-choice [exercise]="s.exercise" [feedback]="feedback()" (answer)="answer.set($event)" /> }
                @case ('ordering') { <app-ordering [exercise]="s.exercise" [feedback]="feedback()" (answer)="answer.set($event)" /> }
                @case ('keyboard') { <app-keyboard-exercise [exercise]="s.exercise" [feedback]="feedback()" (answer)="answer.set($event)" /> }
                @default { <p class="alert warn">This kind of exercise can't be shown yet.</p> }
              }
            </div>
          }
        </main>

        <footer class="bottom" [class.ok]="feedback()?.isCorrect" [class.bad]="feedback() && !feedback()!.isCorrect">
          <div class="inner">
            @if (feedback(); as f) {
              <div class="fb" role="status">
                <span class="fb-icon"><app-icon [name]="f.isCorrect ? 'check' : 'x'" [size]="26" /></span>
                <div>
                  <strong>{{ f.isCorrect ? praise() : 'Not quite.' }}</strong>
                  @if (f.explanation) { <p>{{ f.explanation }}</p> }
                </div>
              </div>
              <button class="btn" [class.success]="f.isCorrect" [class.danger]="!f.isCorrect" (click)="next()" [disabled]="busy()">Continue</button>
            } @else if (isInfo()) {
              <span class="spacer"></span>
              <button class="btn" (click)="next()" [disabled]="busy()">Continue</button>
            } @else {
              <span class="hint muted small">{{ answer() ? 'Ready when you are.' : 'Choose your answer.' }}</span>
              <button class="btn" (click)="check()" [disabled]="!answer() || busy()">Check answer</button>
            }
          </div>
        </footer>
      } @else {
        <div class="spinner"></div>
      }
    </div>
  `,
  styles: `
    .player { min-height: 100dvh; display: flex; flex-direction: column; }
    .top { display: flex; align-items: center; gap: 1.1rem; max-width: 760px; width: 100%; margin: 0 auto; padding: 1.4rem 16px 0.5rem; }
    .close { color: var(--muted); display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; }
    .close:hover { background: var(--paper-deep); color: var(--ink); }
    .lesson-progress { flex: 1; height: 16px; background: var(--paper-deep); }
    .combo { display: inline-flex; align-items: center; gap: 3px; color: var(--pencil); min-width: 42px; font-weight: 800; }
    .combo .numeral { font-size: 1.1rem; color: var(--muted); }
    .combo.hot { color: var(--flame); }
    .combo.hot .numeral { color: var(--ink); }
    .stage { flex: 1; width: 100%; max-width: 700px; margin: 0 auto; padding: 0.75rem 16px 10rem; }
    .lesson-name { font: italic 600 1.05rem var(--font-display); color: var(--violet); margin: 0.5rem 0 0.75rem; }
    .sheet { padding: 2rem 2rem 2.25rem; animation: pop 0.22s ease-out; }
    .sheet ::ng-deep h2 { font-size: 1.7rem; margin-bottom: 1.2rem; }
    .retry { display: inline-block; font-weight: 800; font-size: 0.9rem; color: var(--lacca-deep); background: var(--lacca-wash); padding: 0.2rem 0.75rem; border-radius: 999px; margin: 0 0 0.75rem; }
    .bottom { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; box-shadow: 0 -8px 28px -14px rgba(56, 44, 140, 0.3); }
    .bottom.ok { background: var(--verdigris-wash); }
    .bottom.bad { background: var(--lacca-wash); }
    .inner { max-width: 760px; margin: 0 auto; padding: 1.1rem 16px calc(1.1rem + env(safe-area-inset-bottom)); display: flex; align-items: center; gap: 1.25rem; }
    .inner .btn { min-width: 180px; }
    .hint { flex: 1; font-weight: 700; }
    .fb { flex: 1; display: flex; gap: 0.85rem; align-items: flex-start; animation: pop 0.2s; }
    .fb-icon { flex-shrink: 0; width: 46px; height: 46px; border-radius: 50%; background: #fff; display: grid; place-items: center; }
    .ok .fb-icon { color: var(--verdigris); }
    .bad .fb-icon { color: var(--lacca); }
    .fb strong { display: block; font: italic 600 1.5rem var(--font-display); }
    .ok .fb strong { color: var(--verdigris-deep); }
    .bad .fb strong { color: var(--lacca-deep); }
    .fb p { margin: 0.15rem 0 0; color: var(--ink); max-width: 40rem; }
    .center-box { max-width: 560px; margin: 0 auto; padding: 5rem 16px 3rem; display: flex; flex-direction: column; gap: 1rem; }
    .certificate { padding: 4rem 2rem 2rem; text-align: center; animation: pop 0.3s ease-out; }
    .cheer { position: absolute; top: -70px; left: 50%; transform: translateX(-50%); }
    .certificate h1 { margin: 0.2rem 0 0.5rem; }
    .results { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.85rem; margin: 1.5rem 0 1.75rem; }
    .res { display: flex; flex-direction: column; padding: 0.9rem 0.5rem 1rem; }
    .res .numeral { font-size: 1.7rem; line-height: 1.1; }
    .res span:last-child { font-size: 0.82rem; font-weight: 700; color: var(--ink-soft); }
    .notes { list-style: none; padding: 0; margin: 0 0 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; text-align: left; }
    .notes li { padding: 0.6rem 0.9rem; border-radius: 14px; background: var(--paper); font-weight: 700; color: var(--ink-soft); }
    .notes .opened { background: var(--violet-soft); color: var(--violet-deep); }
    .notes .streak { background: var(--naples-wash); color: #7a5200; }
    .actions { justify-content: center; }
    @media (max-width: 560px) {
      .sheet { padding: 1.4rem 1.1rem 1.6rem; }
      .inner { flex-direction: column; align-items: stretch; }
      .inner .btn { width: 100%; }
      .inner .spacer, .hint { display: none; }
      .certificate { padding: 3.5rem 1.1rem 1.5rem; }
      .results { gap: 0.5rem; }
    }
  `,
  host: { '(document:keydown.enter)': 'onEnter($event)' },
})
export class LessonPlayerPage {
  private readonly api = inject(ApiService);
  private readonly audio = inject(AudioService);
  private readonly router = inject(Router);
  private readonly stats = inject(StatsStore);

  readonly slug = input.required<string>();

  protected readonly lesson = signal<LessonPlay | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly blockedCode = signal<string | undefined>(undefined);
  protected readonly result = signal<CompleteLessonResult | null>(null);
  protected readonly busy = signal(false);

  private readonly queue = signal<Step[]>([]);
  private readonly position = signal(0);
  private uid = 0;
  protected readonly answer = signal<ExerciseAnswer | null>(null);
  protected readonly feedback = signal<CheckAnswerResult | null>(null);
  protected readonly combo = signal(0);
  private readonly firstAnswers = new Map<number, ExerciseAnswer>();

  protected readonly currentStep = computed(() => {
    const s = this.queue()[this.position()];
    return s ? [s] : [];
  });
  protected readonly isInfo = computed(() => this.currentStep()[0]?.exercise.type === 'info');
  protected readonly progressPct = computed(() => {
    const total = this.queue().length;
    const done = this.position() + (this.feedback() ? 1 : 0);
    return total ? (100 * done) / total : 0;
  });

  private readonly praises = ['Bravo.', 'Exactly so.', 'Well played.', 'Correct.', 'Just right.'];
  protected praise(): string {
    return this.praises[this.position() % this.praises.length];
  }

  ngOnInit(): void {
    void this.load(this.slug());
  }

  protected goTo(slug: string): void {
    void this.router.navigate(['/lesson', slug]).then(() => this.load(slug));
  }

  private async load(slug: string): Promise<void> {
    this.lesson.set(null);
    this.result.set(null);
    this.error.set(null);
    this.firstAnswers.clear();
    this.position.set(0);
    this.combo.set(0);
    this.reset();
    try {
      const l = await this.api.lesson(slug);
      this.queue.set(l.exercises.map((exercise) => ({ uid: ++this.uid, exercise, retry: false })));
      this.lesson.set(l);
    } catch (e) {
      this.blockedCode.set(errorCode(e));
      this.error.set(errorMessage(e));
    }
  }

  protected async check(): Promise<void> {
    const step = this.currentStep()[0];
    const answer = this.answer();
    const lesson = this.lesson();
    if (!step || !answer || !lesson || this.feedback()) return;

    this.busy.set(true);
    try {
      const fb = await this.api.checkAnswer(lesson.id, step.exercise.id, answer);
      if (!this.firstAnswers.has(step.exercise.id)) this.firstAnswers.set(step.exercise.id, answer);
      this.feedback.set(fb);
      this.audio.cue(fb.isCorrect);
      if (fb.isCorrect) {
        this.combo.update((c) => c + 1);
      } else {
        this.combo.set(0);
        this.queue.update((q) => [...q, { uid: ++this.uid, exercise: step.exercise, retry: true }]);
      }
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async next(): Promise<void> {
    if (this.position() + 1 < this.queue().length) {
      this.position.update((p) => p + 1);
      this.reset();
      return;
    }
    await this.finish();
  }

  private async finish(): Promise<void> {
    const lesson = this.lesson();
    if (!lesson) return;
    this.busy.set(true);
    try {
      const answers = [...this.firstAnswers.entries()].map(([exerciseId, answer]) => ({ exerciseId, answer }));
      this.result.set(await this.api.completeLesson(lesson.id, answers));
      void this.stats.refresh().catch(() => undefined);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }

  private reset(): void {
    this.answer.set(null);
    this.feedback.set(null);
  }

  protected onEnter(e: Event): void {
    if (this.busy() || this.result() || !this.lesson()) return;
    if ((e.target as HTMLElement)?.closest?.('.bottom')) return;
    if (this.feedback() || this.isInfo()) void this.next();
    else if (this.answer()) void this.check();
  }
}
