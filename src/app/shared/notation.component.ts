import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, signal, viewChild } from '@angular/core';
import { AudioService } from '../core/audio.service';
import { displayedAccidental, keyToMidi } from '../core/music';
import { Notation } from '../core/models';
import { IconComponent } from './icon.component';

type VexModule = typeof import('vexflow/bravura');

let vexflow: Promise<VexModule> | null = null;
function loadVexFlow(): Promise<VexModule> {
  vexflow ??= import('vexflow/bravura').then(async (m) => {
    await Promise.all([document.fonts?.load('30px Bravura'), document.fonts?.load('12px Academico')]).catch(() => undefined);
    await document.fonts?.ready;
    return m;
  });
  return vexflow;
}

@Component({
  selector: 'app-notation',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notation">
      <div #host class="score" role="img" [attr.aria-label]="ariaLabel()"></div>
      @if (error()) {
        <p class="muted small">{{ error() }}</p>
      }
      @if (playable()) {
        <button type="button" class="play" (click)="play()" aria-label="Play bass line">
          <app-icon name="play" [size]="18" /> Listen
        </button>
      }
    </div>
  `,
  styles: `
    .notation { position: relative; background: #fffdf8; border: 2px solid var(--rule-soft); border-radius: var(--radius); padding: 2.25rem 0.5rem 0.25rem; }
    .score { width: 100%; min-height: 120px; }
    .score ::ng-deep svg { width: 100%; height: auto; display: block; }
    .play { position: absolute; top: 8px; right: 8px; display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--rule);
      background: var(--leaf); color: var(--cobalt); border-radius: 999px; padding: 3px 11px 3px 8px; font: 700 0.85rem var(--font-ui); cursor: pointer; }
    .play:hover { border-color: var(--primary); }
  `,
})
export class NotationComponent {
  private readonly audio = inject(AudioService);
  readonly notation = input.required<Notation>();
  readonly playable = input(true);

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const n = this.notation();
      const el = this.host().nativeElement;
      void this.render(el, n);
    });
  }

  protected ariaLabel(): string {
    const n = this.notation();
    return `Bass line: ${n.notes
      .map((x) => `${x.keys.join(' ').replace(/\/\d/g, '').toUpperCase()}${x.figures?.length ? ' figured ' + x.figures.join(' ') : ''}`)
      .join(', ')}`;
  }

  protected play(): void {
    this.audio.playSequence(this.notation().notes.map((n) => n.keys.map(keyToMidi)));
  }

  private async render(el: HTMLDivElement, n: Notation): Promise<void> {
    try {
      const VF = await loadVexFlow();
      const { Renderer, Stave, StaveNote, Voice, Formatter, Annotation, Accidental, AnnotationVerticalJustify } = VF;
      el.innerHTML = '';

      const noteWidth = 64;
      const staveWidth = Math.max(260, 110 + n.notes.length * noteWidth);
      const height = 215;
      const renderer = new Renderer(el, Renderer.Backends.SVG);
      renderer.resize(staveWidth + 20, height);
      const ctx = renderer.getContext();

      const stave = new Stave(10, 62, staveWidth);
      stave.addClef(n.clef);
      if (n.keySignature) stave.addKeySignature(n.keySignature);
      if (n.timeSignature) stave.addTimeSignature(n.timeSignature);
      stave.setContext(ctx).draw();
      stave.setNoteStartX(stave.getNoteStartX() + 20);

      const notes = n.notes.map((spec) => {
        const note = new StaveNote({ clef: n.clef, keys: spec.keys, duration: spec.duration });
        spec.keys.forEach((k, i) => {
          const acc = displayedAccidental(k, n.keySignature);
          if (acc) note.addModifier(new Accidental(acc), i);
        });
        [...(spec.figures ?? [])].reverse().forEach((f) => {
          const a = new Annotation(f).setVerticalJustification(AnnotationVerticalJustify.TOP);
          a.setFont('Nunito', 15, 'bold');
          if (f === '?') a.setStyle({ fillStyle: '#6a4be0' });
          note.addModifier(a);
        });
        if (spec.label) {
          const l = new Annotation(spec.label).setVerticalJustification(AnnotationVerticalJustify.BOTTOM);
          l.setFont('Nunito', 12, 'bold');
          l.setStyle({ fillStyle: '#7d7158' });
          note.addModifier(l);
        }
        if (spec.highlight) note.setStyle({ fillStyle: '#6a4be0', strokeStyle: '#6a4be0' });
        return note;
      });

      const voice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT).addTickables(notes);
      new Formatter().joinVoices([voice]).format([voice], staveWidth - (stave.getNoteStartX() - 10) - 20);
      voice.draw(ctx, stave);

      const svg = el.querySelector('svg');
      if (svg) {
        svg.setAttribute('viewBox', `0 0 ${staveWidth + 20} ${height}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.maxWidth = `${Math.max(400, (staveWidth + 20) * 1.45)}px`;
        svg.style.margin = '0 auto';
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.removeAttribute('width');
        svg.removeAttribute('height');
      }
      el.style.width = '';
      el.style.height = '';
      this.error.set(null);
    } catch (e) {
      console.error('Notation render failed', e);
      this.error.set('Notation could not be displayed.');
    }
  }
}
