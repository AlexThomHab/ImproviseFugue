import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type LadderState = 'plain' | 'locked' | 'available' | 'current' | 'completed' | 'mastered';

export interface LadderNote {
  figures: string[];
  degree: string;
  state: LadderState;
  label: string;
}

const STEP = 5;
const TOP_LINE = 70;
const C3_Y = 95;
const SPACING = 66;
const FIRST_X = 104;

@Component({
  selector: 'app-staff-ladder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'0 0 ' + width() + ' 150'" role="group" [attr.aria-label]="ariaLabel()">
      @for (y of lines; track y) {
        <line x1="8" [attr.x2]="width() - 8" [attr.y1]="y" [attr.y2]="y" class="staff" />
      }
      <line x1="8" x2="8" [attr.y1]="lines[0]" [attr.y2]="lines[4]" class="bar" />
      <line [attr.x1]="width() - 8" [attr.x2]="width() - 8" [attr.y1]="lines[0]" [attr.y2]="lines[4]" class="bar end" />

      <g class="clef" transform="translate(20 0)">
        <circle cx="12" cy="80" r="5.2" />
        <path d="M7.5 79 C 8 66, 36 62, 38 80 C 40 98, 22 112, 4 118" />
        <circle cx="47" cy="75" r="2.6" />
        <circle cx="47" cy="85" r="2.6" />
      </g>

      @for (n of placed(); track $index; let i = $index) {
        <g
          class="note"
          [class]="'note ' + n.state"
          [class.active]="i === activeIndex()"
          [class.selected]="i === selectedIndex()"
          [attr.tabindex]="interactive() ? 0 : null"
          [attr.role]="interactive() ? 'button' : null"
          [attr.aria-label]="n.label"
          [attr.aria-pressed]="interactive() ? i === selectedIndex() : null"
          (click)="pick(i)"
          (keydown.enter)="pick(i)"
          (keydown.space)="$event.preventDefault(); pick(i)"
        >
          <rect [attr.x]="n.x - 30" y="4" width="60" height="142" class="hit" />
          @for (l of n.ledgers; track l) {
            <line [attr.x1]="n.x - 13" [attr.x2]="n.x + 13" [attr.y1]="l" [attr.y2]="l" class="staff ledger" />
          }
          @if (n.state === 'current') {
            <ellipse [attr.cx]="n.x" [attr.cy]="n.y" rx="17" ry="13" class="halo" />
          }
          <ellipse [attr.cx]="n.x" [attr.cy]="n.y" rx="8.4" ry="6" [attr.transform]="'rotate(-22 ' + n.x + ' ' + n.y + ')'" class="head" />
          @for (f of n.figures; track $index; let fi = $index) {
            <text [attr.x]="n.x" [attr.y]="48 - (n.figures.length - 1 - fi) * 14" class="figure">{{ f }}</text>
          }
          <text [attr.x]="n.x" y="138" class="degree">{{ n.degree }}</text>
        </g>
      }
    </svg>
  `,
  styles: `
    :host { display: block; }
    svg { width: 100%; height: auto; display: block; overflow: visible; }
    .staff { stroke: var(--lilac-deep); stroke-width: 1.4; opacity: 0.7; }
    .bar { stroke: var(--lilac-deep); stroke-width: 1.6; }
    .bar.end { stroke-width: 4; }
    .clef circle { fill: var(--violet-deep); }
    .clef path { fill: none; stroke: var(--violet-deep); stroke-width: 3.6; stroke-linecap: round; }
    .hit { fill: transparent; }
    .note { outline: none; }
    .note[role='button'] { cursor: pointer; }
    .head { fill: var(--violet); stroke: var(--violet-deep); stroke-width: 1.8; transition: fill 0.2s; }
    .figure { font: 600 14px var(--font-display); fill: var(--ink-soft); text-anchor: middle; }
    .degree { font: 600 13px var(--font-display); fill: var(--muted); text-anchor: middle; }
    .available .head, .current .head { fill: #fff; stroke: var(--violet); stroke-width: 2.6; }
    .locked .head { fill: var(--paper); stroke: var(--pencil); stroke-dasharray: 3 2.5; }
    .locked .figure, .locked .degree { fill: var(--pencil); }
    .locked .ledger { opacity: 0.35; }
    .mastered .head { fill: var(--naples); stroke: var(--naples-deep); }
    .halo { fill: var(--butter); animation: halo 2.2s ease-in-out infinite; }
    .active .head { fill: var(--pink-deep); stroke: var(--pink-deep); }
    .active .figure { fill: var(--pink-deep); }
    .selected .degree { fill: var(--violet); font-weight: 700; }
    .selected .head { stroke: var(--violet-deep); stroke-width: 3; }
    .note[role='button']:hover .head { stroke: var(--violet-deep); }
    .note:focus-visible .hit { stroke: var(--violet); stroke-width: 2; stroke-dasharray: 4 3; rx: 10; }
  `,
})
export class StaffLadderComponent {
  readonly notes = input.required<LadderNote[]>();
  readonly activeIndex = input<number | null>(null);
  readonly selectedIndex = input<number | null>(null);
  readonly interactive = input(false);
  readonly select = output<number>();

  protected readonly lines = [0, 1, 2, 3, 4].map((i) => TOP_LINE + i * 2 * STEP);
  protected readonly width = computed(() => FIRST_X + this.notes().length * SPACING - 10);

  protected readonly placed = computed(() =>
    this.notes().map((n, i) => {
      const y = C3_Y - (i % 8) * STEP;
      const ledgers: number[] = [];
      for (let l = TOP_LINE - 2 * STEP; l >= y; l -= 2 * STEP) ledgers.push(l);
      return { ...n, x: FIRST_X + i * SPACING, y, ledgers };
    }),
  );

  protected readonly ariaLabel = computed(() => this.notes().map((n) => n.label).join(', '));

  protected pick(i: number): void {
    if (this.interactive()) this.select.emit(i);
  }
}

export const RULE_OF_OCTAVE_FIGURES = [['5', '3'], ['6', '4', '3'], ['6'], ['6', '5'], ['5', '3'], ['6'], ['6', '5'], ['5', '3']];

export const RULE_OF_OCTAVE_VOICINGS = [
  [48, 64, 67, 72],
  [50, 65, 67, 71],
  [52, 67, 72],
  [53, 69, 72, 74],
  [55, 67, 71, 74],
  [57, 72, 77],
  [59, 74, 77, 79],
  [60, 76, 79, 84],
];
