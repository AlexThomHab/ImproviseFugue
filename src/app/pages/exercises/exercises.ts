import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  CheckAnswerResult,
  Exercise,
  ExerciseAnswer,
  InfoContent,
  KeyboardContent,
  MultipleChoiceContent,
  OrderingContent,
} from '../../core/models';
import { NotationComponent } from '../../shared/notation.component';
import { PianoKeyboardComponent } from '../../shared/piano-keyboard.component';

@Component({
  selector: 'app-info-exercise',
  imports: [NotationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>{{ c().title }}</h2>
    @for (p of c().body ?? []; track $index) {
      <p class="body">{{ p }}</p>
    }
    @if (c().notation; as n) {
      <app-notation [notation]="n" />
    }
  `,
  styles: `.body { font-size: 1.08rem; line-height: 1.65; color: var(--ink-soft); max-width: 38rem; } app-notation { display: block; margin-top: 1.25rem; }`,
})
export class InfoExerciseComponent {
  readonly exercise = input.required<Exercise>();
  protected readonly c = computed(() => this.exercise().content as InfoContent);
}

@Component({
  selector: 'app-multiple-choice',
  imports: [NotationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>{{ c().prompt }}</h2>
    @if (c().notation; as n) {
      <app-notation [notation]="n" />
    }
    <div class="options" [class.grid]="compact()" role="radiogroup" [attr.aria-label]="c().prompt">
      @for (o of c().options; track $index; let i = $index) {
        <button
          type="button"
          role="radio"
          class="option"
          [attr.aria-checked]="selected() === i"
          [class.selected]="selected() === i"
          [class.correct]="feedback() && i === correctIndex()"
          [class.wrong]="feedback() && selected() === i && i !== correctIndex()"
          [disabled]="!!feedback()"
          (click)="choose(i)"
        >
          <span class="num">{{ i + 1 }}</span>
          <span>{{ o }}</span>
        </button>
      }
    </div>
  `,
  styles: `
    app-notation { display: block; margin-bottom: 1.25rem; }
    .options { display: grid; gap: 0.75rem; }
    .options.grid { grid-template-columns: 1fr 1fr; gap: 0.9rem; }
    .option { display: flex; align-items: center; gap: 0.9rem; text-align: left; padding: 0.95rem 1.1rem; border-radius: 18px; border: 2px solid var(--rule);
      box-shadow: 0 4px 0 var(--rule); background: #fff; font: 700 1.05rem var(--font-ui); color: var(--ink); cursor: pointer;
      transition: border-color 0.12s, background-color 0.12s, transform 0.07s; }
    .grid .option { justify-content: center; min-height: 84px; font: 600 1.4rem var(--font-display); }
    .grid .num { display: none; }
    .option:hover:not(:disabled) { border-color: var(--lilac-deep); }
    .option:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 1px 0 var(--rule); }
    .option.selected { border-color: var(--violet); background: var(--violet-soft); box-shadow: 0 4px 0 var(--violet); color: var(--violet-deep); }
    .option.correct { border-color: var(--verdigris); background: var(--verdigris-wash); box-shadow: 0 4px 0 var(--verdigris); color: var(--verdigris-deep); }
    .option.wrong { border-color: var(--lacca); background: var(--lacca-wash); box-shadow: 0 4px 0 var(--lacca); color: var(--lacca-deep); }
    .option:disabled { cursor: default; }
    .num { flex-shrink: 0; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 10px; border: 2px solid var(--rule); font: 800 0.85rem var(--font-ui); color: var(--muted); }
    .selected .num { border-color: var(--violet); color: var(--violet); }
  `,
  host: { '(document:keydown)': 'onKey($event)' },
})
export class MultipleChoiceComponent {
  readonly exercise = input.required<Exercise>();
  readonly feedback = input<CheckAnswerResult | null>(null);
  readonly answer = output<ExerciseAnswer | null>();

  protected readonly c = computed(() => this.exercise().content as MultipleChoiceContent);
  protected readonly selected = signal<number | null>(null);
  protected readonly correctIndex = computed(() => this.feedback()?.correctAnswer?.correctIndex as number | undefined);
  protected readonly compact = computed(() => this.c().options.every((o) => o.length <= 16));

  protected choose(i: number): void {
    if (this.feedback()) return;
    this.selected.set(i);
    this.answer.emit({ selectedIndex: i });
  }

  protected onKey(e: KeyboardEvent): void {
    const n = Number(e.key);
    if (Number.isInteger(n) && n >= 1 && n <= this.c().options.length && !(e.target instanceof HTMLInputElement)) this.choose(n - 1);
  }
}

@Component({
  selector: 'app-ordering',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>{{ c().prompt }}</h2>
    <div class="line" [class.correct]="feedback()?.isCorrect" [class.wrong]="feedback() && !feedback()!.isCorrect" aria-label="Your order">
      @for (id of placed(); track id; let i = $index) {
        <button type="button" class="tile" [disabled]="!!feedback()" (click)="remove(id)">
          <span class="idx">{{ i + 1 }}</span>{{ label(id) }}
        </button>
      } @empty {
        <span class="muted small hint">Tap the cards below in order.</span>
      }
    </div>
    <div class="bank" aria-label="Available tiles">
      @for (it of bank(); track it.id) {
        <button type="button" class="tile" [class.used]="placed().includes(it.id)" [disabled]="placed().includes(it.id) || !!feedback()" (click)="place(it.id)">
          {{ it.label }}
        </button>
      }
    </div>
    @if (feedback() && !feedback()!.isCorrect && correctOrder().length) {
      <p class="small muted">The correct order is <strong>{{ correctOrder().join(', ') }}</strong>.</p>
    }
  `,
  styles: `
    .line { min-height: 76px; display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; padding: 0.75rem; margin-bottom: 1.4rem;
      border-radius: 18px; border: 2px dashed var(--rule); background: var(--paper); }
    .line.correct { border: 2px solid var(--verdigris); background: var(--verdigris-wash); }
    .line.wrong { border: 2px solid var(--lacca); background: var(--lacca-wash); }
    .bank { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }
    .tile { display: inline-flex; align-items: baseline; gap: 0.5rem; padding: 0.7rem 1.15rem; border-radius: 16px; border: 2px solid var(--rule);
      box-shadow: 0 4px 0 var(--rule); background: #fff; font: 600 1.25rem var(--font-display); color: var(--ink); cursor: pointer; }
    .tile:hover:not(:disabled) { border-color: var(--lilac-deep); }
    .tile.used { visibility: hidden; }
    .tile:disabled { cursor: default; }
    .idx { font: 800 0.8rem var(--font-ui); color: var(--violet); }
    .hint { width: 100%; text-align: center; }
  `,
})
export class OrderingComponent {
  readonly exercise = input.required<Exercise>();
  readonly feedback = input<CheckAnswerResult | null>(null);
  readonly answer = output<ExerciseAnswer | null>();

  protected readonly c = computed(() => this.exercise().content as OrderingContent);
  protected readonly bank = computed(() => shuffle(this.c().items));
  protected readonly placed = signal<string[]>([]);
  protected readonly correctOrder = computed(() => ((this.feedback()?.correctAnswer?.order as string[]) ?? []).map((id) => this.label(id)));

  protected label(id: string): string {
    return this.c().items.find((i) => i.id === id)?.label ?? id;
  }

  protected place(id: string): void {
    this.placed.update((p) => [...p, id]);
    this.emit();
  }

  protected remove(id: string): void {
    this.placed.update((p) => p.filter((x) => x !== id));
    this.emit();
  }

  private emit(): void {
    const p = this.placed();
    this.answer.emit(p.length === this.c().items.length ? { order: p } : null);
  }
}

@Component({
  selector: 'app-keyboard-exercise',
  imports: [NotationComponent, PianoKeyboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>{{ c().prompt }}</h2>
    @if (c().notation; as n) {
      <app-notation [notation]="n" />
    }
    <app-piano-keyboard
      [low]="c().lowMidi ?? 48"
      [high]="c().highMidi ?? 72"
      [selected]="selected()"
      [disabled]="!!feedback()"
      [correctPitchClasses]="feedback()?.correctAnswer?.pitchClasses ?? null"
      (keyPress)="press($event)"
    />
    <p class="muted small center">Tap a key to hear it and select it. Any octave counts.</p>
  `,
  styles: `app-notation { display: block; margin-bottom: 1rem; } app-piano-keyboard { display: block; margin-top: 0.5rem; } p { margin-top: 0.75rem; }`,
})
export class KeyboardExerciseComponent {
  readonly exercise = input.required<Exercise>();
  readonly feedback = input<CheckAnswerResult | null>(null);
  readonly answer = output<ExerciseAnswer | null>();

  protected readonly c = computed(() => this.exercise().content as KeyboardContent);
  protected readonly selected = signal<number[]>([]);

  protected press(midi: number): void {
    this.selected.set([midi]);
    this.answer.emit({ midi: [midi] });
  }
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.length > 1 && a.every((x, i) => x === items[i]) ? [...a.slice(1), a[0]] : a;
}
