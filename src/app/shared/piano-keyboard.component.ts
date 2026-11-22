import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { AudioService } from '../core/audio.service';
import { isBlackKey, pitchName } from '../core/music';

interface KeyView {
  midi: number;
  black: boolean;
  left: number;
  label: string;
}

@Component({
  selector: 'app-piano-keyboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="piano" [class.disabled]="disabled()" role="group" aria-label="Piano keyboard">
      @for (k of keys(); track k.midi) {
        <button
          type="button"
          class="key"
          [class.black]="k.black"
          [class.white]="!k.black"
          [class.selected]="selected().includes(k.midi)"
          [class.correct]="isCorrect(k.midi)"
          [class.wrong]="isWrong(k.midi)"
          [style.left.%]="k.left"
          [style.width.%]="k.black ? blackWidth() : whiteWidth()"
          [disabled]="disabled()"
          [attr.aria-label]="k.label"
          [attr.aria-pressed]="selected().includes(k.midi)"
          (click)="press(k.midi)"
        >
          @if (!k.black && k.midi % 12 === 0) {
            <span class="c-label">C{{ k.midi / 12 - 1 }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: `
    .piano { position: relative; height: 170px; user-select: none; border-radius: 14px; overflow: hidden; border: 3px solid var(--violet-deep); border-top-width: 10px; background: var(--violet-deep); }
    .key { position: absolute; top: 0; padding: 0; border: none; cursor: pointer; transition: background 0.1s; }
    .white { height: 100%; background: #fbf6e8; border-right: 1px solid var(--rule); border-radius: 0 0 4px 4px; z-index: 1; }
    .white:hover { background: #fffaf0; }
    .black { height: 60%; background: var(--ink); border-radius: 0 0 6px 6px; z-index: 2; box-shadow: inset 0 -4px 0 #0f0c26; }
    .black:hover { background: #3b3570; }
    .key.selected.white { background: var(--primary-soft); box-shadow: inset 0 -8px 0 var(--primary); }
    .key.selected.black { background: var(--primary); }
    .key.correct.white { background: var(--success-soft); box-shadow: inset 0 -8px 0 var(--success); }
    .key.correct.black { background: var(--success); }
    .key.wrong.white { background: var(--error-soft); box-shadow: inset 0 -8px 0 var(--error); }
    .key.wrong.black { background: var(--error); }
    .disabled .key { cursor: default; }
    .c-label { position: absolute; bottom: 10px; left: 0; right: 0; text-align: center; font: italic 500 0.75rem var(--font-display); color: var(--muted); }
  `,
})
export class PianoKeyboardComponent {
  private readonly audio = inject(AudioService);

  readonly low = input(48);
  readonly high = input(72);
  readonly selected = input<number[]>([]);
  readonly disabled = input(false);
  readonly correctPitchClasses = input<number[] | null>(null);
  readonly keyPress = output<number>();

  private readonly whiteKeys = computed(() => {
    const result: number[] = [];
    for (let m = this.low(); m <= this.high(); m++) if (!isBlackKey(m)) result.push(m);
    return result;
  });
  protected readonly whiteWidth = computed(() => 100 / this.whiteKeys().length);
  protected readonly blackWidth = computed(() => this.whiteWidth() * 0.62);

  protected readonly keys = computed<KeyView[]>(() => {
    const whites = this.whiteKeys();
    const w = this.whiteWidth();
    const views: KeyView[] = [];
    for (let m = this.low(); m <= this.high(); m++) {
      const black = isBlackKey(m);
      const whiteIndex = whites.indexOf(black ? m - 1 : m);
      const left = black ? (whiteIndex + 1) * w - this.blackWidth() / 2 : whiteIndex * w;
      views.push({ midi: m, black, left, label: `${pitchName(m)}${Math.floor(m / 12) - 1}` });
    }
    return views;
  });

  protected isCorrect(midi: number): boolean {
    const pcs = this.correctPitchClasses();
    if (!pcs || !pcs.includes(midi % 12)) return false;
    const answeredRight = this.selected().some((s) => pcs.includes(s % 12));
    return answeredRight ? this.selected().includes(midi) : midi - 12 < this.low();
  }

  protected isWrong(midi: number): boolean {
    const pcs = this.correctPitchClasses();
    return !!pcs && this.selected().includes(midi) && !pcs.includes(midi % 12);
  }

  protected press(midi: number): void {
    if (this.disabled()) return;
    this.audio.playChord([midi], 0.9);
    this.keyPress.emit(midi);
  }
}
